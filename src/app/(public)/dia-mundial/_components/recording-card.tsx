"use client";

import { useState } from "react";
import Image from "next/image";
import { Clock, ExternalLink, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getDriveThumbnailUrl } from "@/lib/drive-thumbnail";
import { getSpeaker } from "@/lib/recording-topics";

export interface PublicRecording {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  duration: number | null;
  topics: string[];
}

interface RecordingCardProps {
  recording: PublicRecording;
}

export function RecordingCard({ recording }: RecordingCardProps) {
  const thumbnailUrl = getDriveThumbnailUrl(recording.videoUrl);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const showThumbnail = thumbnailUrl !== null && !thumbnailFailed;
  const speaker = getSpeaker(recording.description);

  return (
    <a
      href={recording.videoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-2xl border bg-white transition-shadow hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
    >
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-brand-500 to-brand-800">
        {showThumbnail && (
          <Image
            src={thumbnailUrl}
            alt=""
            fill
            unoptimized
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setThumbnailFailed(true)}
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors group-hover:bg-black/25">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform group-hover:scale-110">
            <Play className="ml-0.5 h-6 w-6 text-brand-600" fill="currentColor" />
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base font-semibold leading-snug line-clamp-2">
          {recording.title}
        </h3>
        {speaker && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {speaker}
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
          {recording.topics.map((topic) => (
            <Badge
              key={topic}
              variant="secondary"
              className="bg-brand-50 text-[11px] text-brand-700"
            >
              {topic}
            </Badge>
          ))}
          {recording.duration && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {recording.duration} min
            </span>
          )}
          <ExternalLink className="ml-auto h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </div>
    </a>
  );
}
