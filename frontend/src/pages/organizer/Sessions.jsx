import EventScoped from './EventScoped';
import SessionsPanel from './panels/SessionsPanel';
export default function Sessions() { return <EventScoped title="Sessions" description="Build the agenda for an event.">{(id) => <SessionsPanel eventId={id} />}</EventScoped>; }
