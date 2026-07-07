export const VEHICLE_MAKES = [
    'Toyota',
    'Suzuki',
    'Honda',
    'Mazda',
    'Nissan',
    'Mitsubishi',
    'BMW',
    'Mercedes-Benz',
    'Hyundai',
    'Kia',
    'Audi',
    'Ford',
    'Other',
];

export const VEHICLE_MODELS: Record<string, string[]> = {
    Toyota: [
        'Allion', 'Premio', 'Corolla', 'Axio', 'Prius', 'Aqua', 'Yaris',
        'Camry', 'Land Cruiser', 'Prado', 'Hilux', 'Vitz', 'CH-R', 'Raize', 'Rush', 'Other'
    ],
    Suzuki: [
        'Alto', 'Swift', 'Wagon R', 'Celerio', 'Baleno', 'Vitara',
        'Every', 'Spacia', 'Hustler', 'Jimny', 'Ertiga', 'Other'
    ],
    Honda: [
        'Civic', 'Accord', 'Fit / Jazz', 'Vezel', 'CR-V', 'Grace',
        'Insight', 'City', 'HR-V', 'Freed', 'Other'
    ],
    Mazda: [
        'Axela (Mazda3)', 'Atenza (Mazda6)', 'Demio (Mazda2)', 'CX-3',
        'CX-5', 'CX-8', 'Flair', 'RX-8', 'Other'
    ],
    Nissan: [
        'Sunny', 'March', 'Leaf', 'X-Trail', 'Qashqai', 'Navara',
        'Caravan', 'Patrol', 'Dayz', 'Note', 'Other'
    ],
    Mitsubishi: [
        'Lancer', 'Montero / Pajero', 'Outlander', 'ASX', 'Eclipse Cross',
        'Triton', 'Mirage', 'Xpander', 'Other'
    ],
    BMW: [
        '3 Series', '5 Series', '7 Series', 'X1', 'X3', 'X5', 'i3', 'Other'
    ],
    'Mercedes-Benz': [
        'C-Class', 'E-Class', 'S-Class', 'A-Class', 'GLA', 'GLC', 'GLE', 'Other'
    ],
    Hyundai: [
        'Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'i10', 'i20', 'Ioniq', 'Venue', 'Other'
    ],
    Kia: [
        'Picanto', 'Rio', 'Cerato', 'Sportage', 'Sorento', 'Seltos', 'Carnival', 'Other'
    ],
    Audi: [
        'A3', 'A4', 'A6', 'Q3', 'Q5', 'Q7', 'Other'
    ],
    Ford: [
        'Fiesta', 'Focus', 'Mondeo', 'Ranger', 'Everest', 'Mustang', 'Other'
    ],
    Other: ['Other'],
};

export const SRI_LANKA_DISTRICTS = [
    'Colombo',
    'Gampaha',
    'Kalutara',
    'Kandy',
    'Matale',
    'Nuwara Eliya',
    'Galle',
    'Matara',
    'Hambantota',
    'Jaffna',
    'Kilinochchi',
    'Mannar',
    'Vavuniya',
    'Mullaitivu',
    'Batticaloa',
    'Ampara',
    'Trincomalee',
    'Kurunegala',
    'Puttalam',
    'Anuradhapura',
    'Polonnaruwa',
    'Badulla',
    'Moneragala',
    'Ratnapura',
    'Kegalle',
];

export const getAvailabilityLabel = (bookings?: any[]) => {
    if (!bookings || !Array.isArray(bookings)) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Find approved bookings where end_date is today or in the future
    const activeBookings = bookings.filter(
        (b) => b.status === 'approved' && b.end_date >= todayStr
    );

    if (activeBookings.length === 0) return null;

    // Sort to find the latest end_date among active approved bookings
    activeBookings.sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime());
    const latestBooking = activeBookings[0];

    // Available from end_date + 1 day
    const endDate = new Date(latestBooking.end_date);
    const availableDate = new Date(endDate);
    availableDate.setDate(availableDate.getDate() + 1);

    const diffDays = Math.ceil((availableDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
        return 'Available from Tomorrow';
    } else if (diffDays === 0) {
        return 'Available Today';
    } else if (diffDays <= 7 && diffDays > 1) {
        const dayName = availableDate.toLocaleDateString('en-US', { weekday: 'long' });
        return `Available from ${dayName}`;
    } else {
        const dateFormatted = availableDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `Available from ${dateFormatted}`;
    }
};
