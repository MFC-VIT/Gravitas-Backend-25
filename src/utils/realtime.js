const supabase = require('../config/supabase');

// Publish a broadcast event 'move_made' to channel `lobby:<lobbyId>`.
// Frontend listens to this event and merges payload into local state.
async function publishMoveMade(lobbyId, payload, options = {}) {
  const { timeoutMs = 1500 } = options;
  const channelName = `lobby:${lobbyId}`;
  const channel = supabase.channel(channelName, {
    config: { broadcast: { self: true, ack: true } },
  });

  return new Promise((resolve) => {
    let done = false;
    const timer = setTimeout(async () => {
      if (done) return;
      done = true;
      try {
        await channel.unsubscribe();
      } catch {}
      resolve(false);
    }, timeoutMs);

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED' && !done) {
        try {
          await channel.send({
            type: 'broadcast',
            event: 'move_made',
            payload,
          });
          done = true;
          clearTimeout(timer);
          await channel.unsubscribe();
          resolve(true);
        } catch (e) {
          done = true;
          clearTimeout(timer);
          try {
            await channel.unsubscribe();
          } catch {}
          resolve(false);
        }
      }
    });
  });
}

module.exports = { publishMoveMade };
