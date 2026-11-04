import { JitsiMeeting } from '@jitsi/react-sdk';
import { AlertTriangle } from 'lucide-react';
import { JITSI_DOMAIN } from '@/utils/constants';
import { KeyValueList } from '@/components/common/KeyValueList';

/**
 * Embeds Jitsi using backend-authorized room info. Room/JWT field names are mapped in utils/fields.js (netSessionView).
 * If the backend gives only a full URL, the room and host are parsed from it.
 */
export function VideoMeeting({ session, user, onClose }) {
  let domain = JITSI_DOMAIN; let room = session.room;
  if (!room && session.meetingUrl) {
    try { const u = new URL(session.meetingUrl); domain = u.host; room = decodeURIComponent(u.pathname.replace(/^\//, '')); } catch { /* invalid URL */ }
  }
  if (!room) {
    return (
      <div className="rounded-xl border border-warning/40 bg-warning/5 p-6">
        <div className="mb-3 flex items-center gap-2 font-semibold text-warning"><AlertTriangle className="h-5 w-5" />Meeting room not provided</div>
        <p className="mb-4 text-sm text-muted">The active session did not include a recognizable Jitsi room name or URL. Update <code>netSessionView</code> in <code>src/utils/fields.js</code> to match the backend field names. Raw session summary:</p>
        <KeyValueList data={session.raw} />
      </div>
    );
  }
  return (
    <div className="h-[60vh] min-h-[420px] overflow-hidden rounded-xl border border-border bg-black">
      <JitsiMeeting
        domain={domain} roomName={room} jwt={session.jwt || undefined}
        configOverwrite={{ prejoinPageEnabled: false, startWithAudioMuted: true, disableDeepLinking: true, disableInviteFunctions: true }}
        interfaceConfigOverwrite={{ SHOW_JITSI_WATERMARK: false, MOBILE_APP_PROMO: false }}
        userInfo={{ displayName: user?.name, email: user?.email }}
        onReadyToClose={onClose}
        getIFrameRef={(node) => { node.style.height = '100%'; node.style.width = '100%'; }}
      />
    </div>
  );
}
