'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

type FeedEvent = {
  id: string;
  type: string;
  note: string | null;
  createdAt: string | Date;
  actor: { displayName: string | null; username: string };
};

type Props = {
  events: FeedEvent[];
};

const REVEAL_DISTANCE = 60;
const SWIPE_THRESHOLD = 48;

export function ActivityFeedList({ events }: Props) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<{ id: string; startX: number; currentX: number } | null>(null);
  const activeIdRef = useRef<string | null>(null);

  async function deleteActivity(id: string) {
    const response = await fetch(`/api/activity/${id}`, { method: 'DELETE' });
    if (!response.ok) return;
    setOpenId((current) => (current === id ? null : current));
    router.refresh();
  }

  function eventLabel(type: string) {
    switch (type) {
      case 'ADDED_CAR': return 'added a car';
      case 'FAVORITED_CAR': return 'favorited a car';
      case 'WISHLISTED_CAR': return 'added a car to wishlist';
      case 'COMMENTED_CAR': return 'commented on a car';
      case 'CREATED_GARAGE': return 'created a garage';
      case 'JOINED_GARAGE': return 'joined a garage';
      case 'SHARED_CAR': return 'shared a car';
      case 'FEATURED_CAR': return 'featured a car';
      case 'FRIEND_REQUEST_SENT': return 'sent a friend request';
      case 'FRIEND_REQUEST_ACCEPTED': return 'became friends';
      default: return type.toLowerCase().replace(/_/g, ' ');
    }
  }

  function handlePointerDown(eventId: string, clientX: number, pointerType: string) {
    if (pointerType !== 'touch') return;
    activeIdRef.current = eventId;
    setDragState({ id: eventId, startX: clientX, currentX: clientX });
  }

  function handlePointerMove(clientX: number) {
    if (!dragState || activeIdRef.current !== dragState.id) return;
    const delta = Math.min(0, clientX - dragState.startX);
    setDragState((current) => current ? { ...current, currentX: clientX } : current);
    if (delta <= 0) return;
  }

  function handlePointerUp() {
    if (!dragState) return;
    const delta = Math.min(0, dragState.currentX - dragState.startX);
    if (delta < -SWIPE_THRESHOLD) {
      setOpenId(dragState.id);
    } else {
      setOpenId(null);
    }
    activeIdRef.current = null;
    setDragState(null);
  }

  return (
    <div className="space-y-2">
      {events.map((event) => {
        const isOpen = openId === event.id;
        const isDragging = dragState?.id === event.id;
        const dragDelta = isDragging ? Math.min(0, dragState.currentX - dragState.startX) : 0;
        const translateX = isDragging ? Math.max(-REVEAL_DISTANCE, dragDelta) : isOpen ? -REVEAL_DISTANCE : 0;

        return (
          <div key={event.id} className="relative overflow-hidden rounded-2xl">
            <div className="absolute inset-y-0 right-0 flex w-[68px] items-center justify-center pr-2">
              <button
                type="button"
                onClick={() => void deleteActivity(event.id)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white transition hover:bg-red-400"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Delete activity</span>
              </button>
            </div>

            <div
              className="relative z-10 rounded-2xl border border-white/8 bg-zinc-950 p-3 text-sm text-zinc-300 transition-transform duration-200 ease-out"
              style={{ transform: `translateX(${translateX}px)`, touchAction: 'pan-y' }}
              onPointerDown={(pointerEvent) => {
                pointerEvent.currentTarget.setPointerCapture?.(pointerEvent.pointerId);
                handlePointerDown(event.id, pointerEvent.clientX, pointerEvent.pointerType);
              }}
              onPointerMove={(pointerEvent) => handlePointerMove(pointerEvent.clientX)}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-white">
                    <span className="font-medium">{event.actor.displayName ?? event.actor.username}</span> {eventLabel(event.type)}
                  </p>
                  {event.note ? <p className="mt-1 text-xs text-zinc-500">{event.note}</p> : null}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
