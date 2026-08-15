import { useParams } from 'react-router-dom';

export default function EditVehiclePage() {
  const { id } = useParams();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="page-title">Edit Vehicle</h1>
        <p className="page-subtitle">Update your vehicle listing details</p>
      </div>

      <div className="card space-y-5">
        <div>
          <label className="label" htmlFor="vehicleName">Vehicle Name</label>
          <input id="vehicleName" type="text" className="input" placeholder="e.g. Honda City 2022" />
        </div>
        <div>
          <label className="label" htmlFor="vehicleType">Vehicle Type</label>
          <select id="vehicleType" className="input">
            <option value="">Select type</option>
            <option value="car">Car</option>
            <option value="bike">Bike</option>
            <option value="scooter">Scooter</option>
            <option value="suv">SUV</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="pricePerDay">Price Per Day (₹)</label>
          <input id="pricePerDay" type="number" className="input" placeholder="e.g. 1500" min="0" />
        </div>
        <div>
          <label className="label" htmlFor="location">Location / City</label>
          <input id="location" type="text" className="input" placeholder="e.g. Bengaluru" />
        </div>
        <div>
          <label className="label" htmlFor="description">Description</label>
          <textarea id="description" className="input resize-none" rows={4} />
        </div>
        <div>
          <label className="label">Current Photos</label>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-slate-200 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button className="btn-primary flex-1">Save Changes</button>
          <button className="btn-ghost" onClick={() => history.back()}>Cancel</button>
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-4">Vehicle ID: {id}</p>
    </div>
  );
}
