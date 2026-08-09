const MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=5B%2F5%20Razia%20Sultana%20Road%2C%20Mohammadpur%2C%20Dhaka'

export default function ViewLocationButton() {
  return (
    <div>
      <a
        href={MAPS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-ghost"
      >
        View Location
        <span aria-hidden="true">↗</span>
      </a>
    </div>
  )
}
