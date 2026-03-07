import React from 'react';

const StatItem = ({ icon, label, value, color, isWide = false, subValue = null }) => {
    return (
        <div className={isWide ? "col-12" : "col-6"}>
            <div style={{
                padding: '18px 12px',
                textAlign: 'center',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.03)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                transition: '0.3s'
            }}>
                <div style={{
                    width: '32px',
                    height: '32px',
                    margin: '0 auto 10px',
                    background: `${color}15`,
                    color: color,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {React.cloneElement(icon, { size: 16 })}
                </div>
                <p style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>{label}</p>
                <p style={{ fontSize: isWide ? '22px' : '17px', fontWeight: '800', color: 'white', margin: '4px 0 0 0' }}>{value}</p>
                {subValue && (
                    <p style={{ fontSize: '11px', fontWeight: '700', color: '#10b981', margin: '2px 0 0 0' }}>{subValue}</p>
                )}
            </div>
        </div>
    );
};

export default StatItem;
