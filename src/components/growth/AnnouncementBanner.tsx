"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { X } from "lucide-react";
import {
  announcementStorageKey,
  getActiveAnnouncement,
} from "@/data/announcements";

const DISMISS_EVENT = "summify-announcement-dismiss";

function subscribe(onStoreChange: () => void) {
  window.addEventListener(DISMISS_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(DISMISS_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getDismissedSnapshot(): boolean {
  const announcement = getActiveAnnouncement();
  if (!announcement) return true;
  return localStorage.getItem(announcementStorageKey(announcement.id)) === "1";
}

function getDismissedServerSnapshot(): boolean {
  return true;
}

export function AnnouncementBanner() {
  const announcement = getActiveAnnouncement();
  const dismissed = useSyncExternalStore(
    subscribe,
    getDismissedSnapshot,
    getDismissedServerSnapshot,
  );

  if (!announcement || dismissed) return null;

  const announcementId = announcement.id;

  function dismiss() {
    const key = announcementStorageKey(announcementId);
    localStorage.setItem(key, "1");
    window.dispatchEvent(new Event(DISMISS_EVENT));
  }

  return (
    <div
      className="relative border-b border-violet-500/20 bg-violet-950/40 px-4 py-2 text-center text-xs leading-snug text-violet-200/90 sm:px-10"
      role="status"
    >
      <p className="pr-8 sm:pr-0">
        <span className="font-medium text-violet-300">{announcement.message}</span>
        {announcement.link ? (
          <>
            <span className="mx-2 hidden text-violet-500/50 sm:inline">·</span>
            <Link
              href={announcement.link.href}
              className="font-medium text-violet-300 underline-offset-2 hover:underline"
            >
              {announcement.link.label}
            </Link>
          </>
        ) : null}
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-violet-400/80 hover:bg-violet-500/10 hover:text-violet-200"
        aria-label="Dismiss announcement"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}
