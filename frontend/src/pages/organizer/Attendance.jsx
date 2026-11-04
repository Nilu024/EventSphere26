import EventScoped from './EventScoped';
import RegistrationsPanel from './panels/RegistrationsPanel';
export default function Attendance() { return <EventScoped title="Registrations & attendance" description="See who registered and record attendance.">{(id) => <RegistrationsPanel eventId={id} />}</EventScoped>; }
