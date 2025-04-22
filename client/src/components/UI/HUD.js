import React from 'react';

const HUD = ({ health, ammo, score }) => {
  return (
    <>
      <div className="hud">
        <div className="health-bar">
          <div className="health-fill" style={{ width: `${health}%` }}></div>
          <span className="health-text">{health}</span>
        </div>
        <div className="ammo-counter">
          Ammo: {ammo}
        </div>
        <div className="score">
          Score: {score}
        </div>
      </div>
      <div className="crosshair"></div>
    </>
  );
};

export default HUD;