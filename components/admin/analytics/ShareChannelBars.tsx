const CHANNEL_LABELS: Record<string, string> = {
  copy_link: "Copy link",
  linkedin: "LinkedIn",
  native: "Share sheet",
  other: "Other",
};

export function ShareChannelBars({
  channels,
}: {
  channels: { channel: string; shares: number }[];
}) {
  const max = Math.max(...channels.map((channel) => channel.shares), 1);

  return (
    <ol className="space-y-2.5">
      {channels.map((channel) => (
        <li key={channel.channel}>
          <div className="mb-1 flex items-center justify-between gap-3">
            <span className="text-xs text-ink-muted">
              {CHANNEL_LABELS[channel.channel] ?? channel.channel}
            </span>
            <span className="t-meta tabular-nums text-ink">{channel.shares}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-paper-sink">
            <div
              className="h-full rounded-full bg-coral"
              style={{ width: `${(channel.shares / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
