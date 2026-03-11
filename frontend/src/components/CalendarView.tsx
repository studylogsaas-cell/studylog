import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { setDefaultOptions } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useNavigate } from 'react-router-dom';

setDefaultOptions({ locale: ptBR });

const locales = {
    'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    resource?: any;
}

interface CalendarViewProps {
    entries: any[];
}

export default function CalendarView({ entries }: CalendarViewProps) {
    const navigate = useNavigate();

    const events: CalendarEvent[] = entries.map(entry => {
        const [y, m, d] = entry.studyDate.split('-').map(Number);

        let sh = 0, sm = 0;
        if (entry.startTime) {
            [sh, sm] = entry.startTime.split(':').map(Number);
        }

        let eh = 23, emin = 59;
        if (entry.endTime) {
            [eh, emin] = entry.endTime.split(':').map(Number);
        }

        const startDate = new Date(y, m - 1, d, sh, sm);
        const endDate = new Date(y, m - 1, d, eh, emin);

        const title = entry.subject?.name || entry.exam?.name || 'Registro sem título';

        return {
            id: entry.id,
            title,
            start: startDate,
            end: endDate,
            resource: entry,
        };
    });

    const messages = {
        allDay: 'Dia todo',
        previous: 'Anterior',
        next: 'Próximo',
        today: 'Hoje',
        month: 'Mês',
        week: 'Semana',
        day: 'Dia',
        agenda: 'Agenda',
        date: 'Data',
        time: 'Hora',
        event: 'Evento',
        noEventsInRange: 'Não há eventos neste período.',
    };

    const handleSelectEvent = (event: CalendarEvent) => {
        navigate(`/entries/${event.id}`);
    };

    return (
        <div className="calendar-wrapper" style={{ height: '70vh', minHeight: '600px', backgroundColor: 'var(--bg-card)', padding: '16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            <Calendar
                localizer={localizer}
                events={events}
                culture="pt-BR"
                messages={messages}
                startAccessor="start"
                endAccessor="end"
                onSelectEvent={handleSelectEvent}
                views={['month', 'week', 'agenda']}
                defaultView="month"
            />
        </div>
    );
}
