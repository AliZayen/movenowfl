import { beforeAll, describe, expect, it } from 'vitest';
import { adminAssign, adminConfirm, createBooking, type Viewer } from '@/app/lib/server/bookings';
import { db } from '@/app/lib/server/db';
import {
  getConversation,
  hideMessage,
  listConversations,
  listMessages,
  markRead,
  sendMessage,
  setConversationClosed,
  startConversation,
  supportUnreadCount,
  unreadCount,
} from '@/app/lib/server/messaging';
import { listConversationsQuery, listMessagesQuery } from '@/app/lib/validation/messaging';
import { freeSlot, newCustomer, newStaff, seeded, statusOf, tvInput } from '../support/fixtures';

let people: Awaited<ReturnType<typeof seeded>>;
let customer: Viewer;
let stranger: Viewer;
let support: Viewer;
let dispatcher: Viewer;

beforeAll(async () => {
  people = await seeded();
  customer = await newCustomer('Morgan Messages');
  stranger = await newCustomer('Sam Stranger');
  support = await newStaff('support');
  dispatcher = await newStaff('dispatcher');
});

/** A fresh booking and its conversation id. */
async function booking() {
  const b = await createBooking(customer, tvInput(await freeSlot()));
  const c = await db.conversation.findUniqueOrThrow({ where: { bookingId: b.id } });
  return { b, cid: c.id };
}
const messages = (v: Viewer, cid: string, q: Record<string, string> = {}) => listMessages(v, cid, listMessagesQuery.parse(q));
const unread = async (v: Viewer, cid: string) => (await getConversation(v, cid)).unreadCount;
const david = () => people.providerOf(people.david);
const leo = () => db.provider.findFirstOrThrow({ where: { displayName: 'Leo Martinez' } });

describe('the conversation that comes with a booking', () => {
  it('is between the customer and support, with the welcome unread for the customer only', async () => {
    const { b, cid } = await booking();
    const c = await getConversation(customer, cid);
    expect(c).toMatchObject({ seat: 'customer', moderator: null, closedAt: null, unreadCount: 1, bookingRef: b.ref });
    expect(c.otherParty).toMatchObject({ kind: 'support', name: 'MoveNow Support' });
    expect(c.permissions).toEqual({ canPost: true, canModerate: false });
    expect(await unread(support, cid)).toBe(0);
    const [welcome] = (await messages(customer, cid)).items;
    expect(welcome).toMatchObject({ automated: true, mine: false, sender: { kind: 'support', name: 'MoveNow Support' } });
  });

  it('shows up in the lists and badge right away', async () => {
    const { cid } = await booking();
    const list = await listConversations(customer, listConversationsQuery.parse({}));
    expect(list.items[0].id).toBe(cid);
    expect((await unreadCount(customer)).count).toBeGreaterThanOrEqual(1);
  });

  it("is hidden from other customers, unassigned pros and staff without support access (404)", async () => {
    const { cid } = await booking();
    for (const v of [stranger, people.mike, dispatcher]) expect(await statusOf(getConversation(v, cid))).toBe(404);
    expect(await statusOf(sendMessage(stranger, cid, 'hi'))).toBe(404);
    expect(await statusOf(getConversation(customer, 'not-a-uuid'))).toBe(404);
  });

  it('support staff are a seat: they can read, post and moderate', async () => {
    const { cid } = await booking();
    const c = await getConversation(support, cid);
    expect(c).toMatchObject({ seat: 'support', permissions: { canPost: true, canModerate: true } });
    const m = await sendMessage(support, cid, 'Hello from support');
    expect(m).toMatchObject({ mine: true, sender: { kind: 'support' } });
  });

  it('"Message" on a booking reuses its conversation', async () => {
    const { b, cid } = await booking();
    const r = await startConversation(customer, b.ref);
    expect(r).toMatchObject({ created: false, conversation: { id: cid } });
  });

  it('bookings from before automatic conversations get one on first open, with their pro as moderator', async () => {
    const { b, cid } = await booking();
    await adminAssign(people.admin, b.id, david().id);
    await db.conversation.delete({ where: { id: cid } }); // as if made before this feature
    const r = await startConversation(customer, b.id);
    expect(r.created).toBe(true);
    expect(r.conversation.moderator?.name).toBe('David Kim');
  });
});

describe('the assigned pro moderates', () => {
  it('assignment adds the pro as moderator and tells the customer', async () => {
    const { b, cid } = await booking();
    await adminAssign(people.admin, b.id, david().id);
    const c = await getConversation(customer, cid);
    expect(c.moderator?.name).toBe('David Kim');
    expect(c.otherParty).toMatchObject({ kind: 'provider', name: 'David Kim' });
    expect(c.participants.map((p) => p.kind)).toEqual(['customer', 'support', 'provider']);
    const last = (await messages(customer, cid)).items.at(-1);
    expect(last).toMatchObject({ automated: true });
    expect(last?.body).toContain('David Kim');
    const pro = await getConversation(people.david, cid);
    expect(pro).toMatchObject({ seat: 'moderator', unreadCount: 0, permissions: { canPost: true, canModerate: true } });
  });

  it('confirming with a pro also makes them moderator', async () => {
    const { b, cid } = await booking();
    await adminConfirm(people.admin, b.id, { providerId: david().id, windowStart: b.preferredSlot, windowEnd: '19:00' });
    expect((await getConversation(people.david, cid)).seat).toBe('moderator');
  });

  it('reassignment replaces the moderator; the old pro loses the thread', async () => {
    const { b, cid } = await booking();
    await adminAssign(people.admin, b.id, david().id);
    await sendMessage(people.david, cid, 'David here');
    const leoPro = await leo();
    await adminAssign(people.admin, b.id, leoPro.id);
    expect((await getConversation(customer, cid)).moderator?.name).toBe('Leo Martinez');
    expect(await statusOf(getConversation(people.david, cid))).toBe(404);
    expect(await statusOf(sendMessage(people.david, cid, 'still here?'))).toBe(404);
    const leoUser = { id: leoPro.userId!, role: 'provider' as const };
    const c = await getConversation(leoUser, cid);
    expect(c).toMatchObject({ seat: 'moderator', unreadCount: 0 }); // history before joining isn't unread
    const body = (await messages(customer, cid)).items.at(-1)?.body;
    expect(body).toContain('Leo Martinez is now your pro');
  });

  it("the pro's messages are labelled as the moderator", async () => {
    const { b, cid } = await booking();
    await adminAssign(people.admin, b.id, david().id);
    await sendMessage(people.david, cid, 'On my way');
    const m = (await messages(customer, cid)).items.at(-1);
    expect(m).toMatchObject({ mine: false, body: 'On my way', sender: { kind: 'provider', moderator: true, name: 'David Kim' } });
  });
});

describe('moderation rules (enforced on the server)', () => {
  async function moderated() {
    const { b, cid } = await booking();
    await adminAssign(people.admin, b.id, david().id);
    return cid;
  }

  it("customers can't close the thread or hide messages", async () => {
    const cid = await moderated();
    const m = await sendMessage(customer, cid, 'hello');
    expect(await statusOf(setConversationClosed(customer, cid, true))).toBe(403);
    expect(await statusOf(hideMessage(customer, cid, m.id))).toBe(403);
  });

  it('closing stops only the customer from posting; reopening restores it', async () => {
    const cid = await moderated();
    const closed = await setConversationClosed(people.david, cid, true);
    expect(closed.closedAt).not.toBeNull();
    expect((await getConversation(customer, cid)).permissions.canPost).toBe(false);
    expect(await statusOf(sendMessage(customer, cid, 'can I post?'))).toBe(403);
    expect(await statusOf(sendMessage(people.david, cid, 'pro can'))).toBe(200);
    expect(await statusOf(sendMessage(support, cid, 'support can'))).toBe(200);
    await setConversationClosed(support, cid, false);
    expect(await statusOf(sendMessage(customer, cid, 'back again'))).toBe(200);
  });

  it("the moderator hides customer and own messages, but not support's", async () => {
    const cid = await moderated();
    const fromCustomer = await sendMessage(customer, cid, 'something rude');
    const fromPro = await sendMessage(people.david, cid, 'typo');
    const fromSupport = await sendMessage(support, cid, 'support note');
    expect((await hideMessage(people.david, cid, fromCustomer.id)).hidden).toBe(true);
    expect((await hideMessage(people.david, cid, fromPro.id)).hidden).toBe(true);
    expect(await statusOf(hideMessage(people.david, cid, fromSupport.id))).toBe(403);
    expect((await hideMessage(support, cid, fromSupport.id)).hidden).toBe(true);
  });

  it('hidden messages show a placeholder to everyone and stop counting as unread', async () => {
    const cid = await moderated();
    await markRead(customer, cid);
    const m = await sendMessage(people.david, cid, 'secret');
    expect(await unread(customer, cid)).toBe(1);
    await hideMessage(people.david, cid, m.id);
    expect(await unread(customer, cid)).toBe(0);
    const seen = (await messages(customer, cid)).items.find((x) => x.id === m.id);
    expect(seen).toMatchObject({ hidden: true, body: 'This message was removed by a moderator.' });
    expect(JSON.stringify(await messages(support, cid))).not.toContain('secret');
  });

  it('hiding a message in another conversation is a 404', async () => {
    const a = await moderated();
    const b = await moderated();
    const m = await sendMessage(customer, a, 'in a');
    expect(await statusOf(hideMessage(people.david, b, m.id))).toBe(404);
  });
});

describe('unread is tracked per seat', () => {
  it("one side reading doesn't clear the other side's badge", async () => {
    const { b, cid } = await booking();
    await adminAssign(people.admin, b.id, david().id);
    await sendMessage(customer, cid, 'question for everyone');
    expect(await unread(people.david, cid)).toBe(1);
    expect(await unread(support, cid)).toBe(1);
    expect((await markRead(people.david, cid)).marked).toBe(1);
    expect(await unread(people.david, cid)).toBe(0);
    expect(await unread(support, cid)).toBe(1); // support still has it
  });

  it("sending marks the thread read for the sender's seat", async () => {
    const { cid } = await booking();
    expect(await unread(customer, cid)).toBe(1); // welcome
    await sendMessage(customer, cid, 'thanks!');
    expect(await unread(customer, cid)).toBe(0);
  });

  it('"Seen" appears once another seat has read past the message', async () => {
    const { cid } = await booking();
    const m = await sendMessage(customer, cid, 'seen yet?');
    expect(m.readAt).toBeNull();
    await markRead(support, cid);
    const again = (await messages(customer, cid)).items.find((x) => x.id === m.id);
    expect(again?.readAt).not.toBeNull();
  });

  it('the support inbox counts unread customer messages', async () => {
    const before = await supportUnreadCount();
    const { cid } = await booking();
    await sendMessage(customer, cid, 'help please');
    expect(await supportUnreadCount()).toBe(before + 1);
    await markRead(support, cid);
    expect(await supportUnreadCount()).toBe(before);
  });
});

describe('message history', () => {
  it('pages back with `before` and polls forward with `after`', async () => {
    const { cid } = await booking();
    for (let i = 1; i <= 5; i++) await sendMessage(customer, cid, `message ${i}`);
    const latest = await messages(customer, cid, { limit: '3' });
    expect(latest.items.map((m) => m.body)).toEqual(['message 3', 'message 4', 'message 5']);
    expect(latest.hasMore).toBe(true);
    const older = await messages(customer, cid, { limit: '3', before: latest.items[0].createdAt });
    // The three before "message 3": the welcome, then messages 1 and 2. Nothing older remains.
    expect(older.items.map((m) => m.body).slice(1)).toEqual(['message 1', 'message 2']);
    expect(older.items[0].automated).toBe(true);
    expect(older.hasMore).toBe(false);
    const newer = await messages(customer, cid, { after: latest.items[1].createdAt });
    expect(newer.items.map((m) => m.body)).toEqual(['message 4', 'message 5']);
  });
});
