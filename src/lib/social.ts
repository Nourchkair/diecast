import { prisma } from '@/lib/prisma';
import type { FriendRequestStatus, GarageType, ActivityType, SpotlightSource } from '@prisma/client';

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
}

export function normalizeLookup(value: string) {
  return value.trim().toLowerCase();
}

export function makeUserCode(userId: string) {
  return userId.slice(0, 8).toUpperCase();
}

export function canonicalFriendPair(userAId: string, userBId: string) {
  return userAId < userBId ? { userAId, userBId } : { userAId: userBId, userBId: userAId };
}

export async function getProfileByUserId(userId: string) {
  return prisma.userProfile.findUnique({ where: { userId } });
}

export async function getProfileByUsername(username: string) {
  return prisma.userProfile.findUnique({ where: { username: normalizeUsername(username) } });
}

export async function searchProfiles(query: string, excludeUserId?: string) {
  const normalizedUsername = normalizeUsername(query);
  const normalizedLookup = normalizeLookup(query);
  if (!normalizedLookup) return [];

  return prisma.userProfile.findMany({
    where: {
      AND: [
        excludeUserId ? { userId: { not: excludeUserId } } : {},
        {
          OR: [
            { username: { contains: normalizedUsername || normalizedLookup, mode: 'insensitive' } },
            { displayName: { contains: query.trim(), mode: 'insensitive' } },
            { email: { contains: normalizedLookup, mode: 'insensitive' } },
            { userId: { startsWith: normalizedLookup } },
          ],
        },
      ],
    },
    orderBy: [{ username: 'asc' }],
    take: 8,
  });
}

export async function findProfileByLookup(query: string) {
  const normalizedUsername = normalizeUsername(query);
  const normalizedLookup = normalizeLookup(query);
  if (!normalizedLookup) return null;

  return prisma.userProfile.findFirst({
    where: {
      OR: [
        normalizedUsername ? { username: normalizedUsername } : undefined,
        { email: normalizedLookup },
        { userId: normalizedLookup },
        { userId: { startsWith: normalizedLookup } },
      ].filter(Boolean) as Array<Record<string, unknown>>,
    },
  });
}

export async function listFriends(userId: string) {
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [{ userAId: userId }, { userBId: userId }],
    },
    include: {
      userA: true,
      userB: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return friendships.map((friendship) => friendship.userAId === userId ? friendship.userB : friendship.userA);
}

export async function listFriendRequests(userId: string) {
  return prisma.friendRequest.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
      status: 'PENDING',
    },
    include: {
      sender: true,
      receiver: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getFriendshipStatus(userId: string, otherUserId: string) {
  const { userAId, userBId } = canonicalFriendPair(userId, otherUserId);
  const friendship = await prisma.friendship.findUnique({ where: { userAId_userBId: { userAId, userBId } } }).catch(() => null);
  if (friendship) return 'friends' as const;

  const incoming = await prisma.friendRequest.findUnique({ where: { senderId_receiverId: { senderId: otherUserId, receiverId: userId } } }).catch(() => null);
  if (incoming?.status === 'PENDING') return 'incoming' as const;

  const outgoing = await prisma.friendRequest.findUnique({ where: { senderId_receiverId: { senderId: userId, receiverId: otherUserId } } }).catch(() => null);
  if (outgoing?.status === 'PENDING') return 'outgoing' as const;

  return 'none' as const;
}

export async function listUserGarages(userId: string) {
  return prisma.garage.findMany({
    where: {
      OR: [
        { personalOwnerId: userId },
        { members: { some: { userId } } },
      ],
    },
    include: {
      createdBy: true,
      members: { include: { user: true } },
    },
    orderBy: [{ updatedAt: 'desc' }],
  });
}

export async function getGarageBySlug(slug: string, userId: string) {
  return prisma.garage.findFirst({
    where: {
      slug,
      OR: [
        { personalOwnerId: userId },
        { members: { some: { userId } } },
      ],
    },
    include: {
      createdBy: true,
      members: { include: { user: true } },
      items: {
        include: {
          item: { include: { images: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] }, garageLinks: true, user: true } },
          addedBy: true,
        },
        orderBy: [{ createdAt: 'desc' }],
      },
      spotlight: { include: { item: { include: { images: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] } } } }, orderBy: [{ weekStart: 'desc' }], take: 1 },
    },
  });
}

export async function getUserFeed(userId: string, friendIds: string[] = []) {
  const visibleActorIds = [userId, ...friendIds];

  return prisma.activityEvent.findMany({
    where: {
      OR: [
        { actorUserId: { in: visibleActorIds } },
        { targetUserId: userId },
      ],
    },
    include: {
      actor: true,
      item: { include: { images: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] } } },
      garage: true,
      targetUser: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function getCarComments(itemId: string) {
  return prisma.carComment.findMany({
    where: { itemId },
    include: { author: true },
    orderBy: { createdAt: 'asc' },
  });
}

export async function hasCarFavorite(userId: string, itemId: string) {
  const favorite = await prisma.carFavorite.findUnique({ where: { userId_itemId: { userId, itemId } } }).catch(() => null);
  return Boolean(favorite);
}

export async function hasCarWishlist(userId: string, itemId: string) {
  const wishlist = await prisma.carWishlist.findUnique({ where: { userId_itemId: { userId, itemId } } }).catch(() => null);
  return Boolean(wishlist);
}
