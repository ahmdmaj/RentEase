export default function AddVehiclePage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="page-title">Add a Vehicle</h1>
        <p className="page-subtitle">List your vehicle for rent on RentEase</p>
      </div>

      <div className="card space-y-5">
        {/* Vehicle Name */}
        <div>
          <label className="label" htmlFor="vehicleName">Vehicle Name</label>
          <input id="vehicleName" type="text" className="input" placeholder="e.g. Honda City 2022" />
        </div>

        {/* Type */}
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

        {/* Price */}
        <div>
          <label className="label" htmlFor="pricePerDay">Price Per Day (₹)</label>
          <input id="pricePerDay" type="number" className="input" placeholder="e.g. 1500" min="0" />
        </div>

        {/* Location */}
        <div>
          <label className="label" htmlFor="location">Location / City</label>
          <input id="location" type="text" className="input" placeholder="e.g. Bengaluru" />
        </div>

        {/* Description */}
        <div>
          <label className="label" htmlFor="description">Description</label>
          <textarea
            id="description"
            className="input resize-none"
            rows={4}
            placeholder="Describe your vehicle — condition, features, fuel type, etc."
          />
        </div>

        {/* Image Upload Placeholder */}
        <div>
          <label className="label">Photos</label>
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 hover:border-primary-300 hover:text-primary-400 transition-colors cursor-pointer">
            <div className="text-3xl mb-2">📷</div>
            <p className="text-sm font-medium">Click to upload photos</p>
            <p className="text-xs mt-1">PNG, JPG up to 10MB</p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button className="btn-primary flex-1">Submit Listing</button>
          <button className="btn-ghost" onClick={() => history.back()}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
