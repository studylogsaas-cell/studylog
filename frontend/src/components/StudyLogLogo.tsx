export default function StudyLogLogo({ size = 32, showText = true, className = '' }: { size?: number; showText?: boolean; className?: string }) {
    return (
        <div className={`studylog-logo ${className}`} style={{ display: 'flex', alignItems: 'center', gap: size * 0.15, textDecoration: 'none' }}>
            <div
                style={{
                    position: 'relative',
                    width: size,
                    height: size,
                    flexShrink: 0,
                    background: 'var(--accent-gradient-duo)',
                    borderRadius: size * 0.22
                }}
            >
                {/* Book & Progress Concept SVG overlaid on the gradient */}
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ position: 'absolute', top: 0, left: 0 }}
                >
                    {/* Book Cover / Spine */}
                    <path
                        d="M16 23C12.5 21 8.5 21 8.5 21V10C8.5 10 12.5 10 16 12C19.5 10 23.5 10 23.5 10V21C23.5 21 19.5 21 16 23Z"
                        fill="#ffffff"
                        fillOpacity="0.15"
                    />
                    <path
                        d="M16 23C12.5 21 8.5 21 8.5 21V10C8.5 10 12.5 10 16 12C19.5 10 23.5 10 23.5 10V21C23.5 21 19.5 21 16 23Z"
                        stroke="#ffffff"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    {/* Center Page Spine */}
                    <path
                        d="M16 23V12"
                        stroke="#ffffff"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Chart / Log Lines indicating progress (on the right page) */}
                    <path d="M19 14H21" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                    <path d="M19 17.5H22" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </div>

            {showText && (
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 0 }}>
                    <div style={{
                        fontSize: size * 0.65,
                        fontWeight: 800,
                        letterSpacing: '-0.03em',
                        fontFamily: 'var(--font-family)',
                        lineHeight: 1.1,
                        paddingBottom: size * 0.05,
                        display: 'flex',
                        alignItems: 'baseline'
                    }}>
                        <div style={{ color: 'var(--text-primary)' }}>Study</div>
                        <div style={{
                            background: 'var(--accent-gradient-duo)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}>Log</div>
                    </div>
                    <div style={{
                        marginTop: size * 0.02,
                        marginLeft: size * 0.03,
                        fontSize: size * 0.16,
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        lineHeight: 1,
                        whiteSpace: 'nowrap'
                    }}>Registros de Estudo</div>
                </div>
            )}
        </div>
    );
}
