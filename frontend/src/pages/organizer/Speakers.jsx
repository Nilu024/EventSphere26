import EventScoped from './EventScoped';
import SpeakersPanel from './panels/SpeakersPanel';
export default function Speakers() { return <EventScoped title="Speakers" description="Manage who is presenting.">{(id) => <SpeakersPanel eventId={id} />}</EventScoped>; }
