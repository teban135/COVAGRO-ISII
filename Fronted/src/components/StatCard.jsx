export default function StatCard({ label, value, desc, variante = '' }) {
    return (
        <div className={`stat-card ${variante}`}>
            <div className="stat-label">{label}</div>
            <div className="stat-value">{value}</div>
            <div className="stat-desc">{desc}</div>
        </div>
    )
}