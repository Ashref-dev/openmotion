import { AbsoluteFill, Img, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

export interface DeviceFrameProps {
  assetUrl: string;
  deviceType: 'browser' | 'phone' | 'tablet' | 'laptop';
  primaryColor?: string;
  showShadow?: boolean;
  durationInFrames: number;
}

const BrowserFrame: React.FC<{
  children: React.ReactNode;
  primaryColor: string;
}> = ({ children, primaryColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const entrance = spring({ frame, fps, config: { damping: 15 } });
  const translateY = interpolate(entrance, [0, 1], [40, 0]);
  
  return (
    <div style={{
      width: '85%',
      maxWidth: 1000,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: '#1a1a2e',
      border: `1px solid ${primaryColor}30`,
      boxShadow: `0 25px 80px rgba(0, 0, 0, 0.5), 0 0 40px ${primaryColor}15`,
      transform: `translateY(${translateY}px)`,
    }}>
      {/* Browser header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        backgroundColor: '#0d0d14',
        borderBottom: `1px solid ${primaryColor}20`,
        gap: 8,
      }}>
        {/* Traffic lights */}
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ff5f57' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ffbd2e' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#28c840' }} />
        </div>
        
        {/* URL bar */}
        <div style={{
          flex: 1,
          marginLeft: 16,
          padding: '6px 12px',
          backgroundColor: '#1a1a2e',
          borderRadius: 6,
          fontSize: 12,
          color: '#666',
          fontFamily: 'monospace',
        }}>
          app.yoursaas.com
        </div>
      </div>
      
      {/* Content */}
      <div style={{
        width: '100%',
        aspectRatio: '16/10',
      }}>
        {children}
      </div>
    </div>
  );
};

const PhoneFrame: React.FC<{
  children: React.ReactNode;
  primaryColor: string;
}> = ({ children, primaryColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const entrance = spring({ frame, fps, config: { damping: 15 } });
  const translateY = interpolate(entrance, [0, 1], [40, 0]);
  const rotateY = interpolate(entrance, [0, 1], [-15, 0]);
  
  return (
    <div style={{
      width: 280,
      borderRadius: 40,
      overflow: 'hidden',
      backgroundColor: '#1a1a2e',
      border: `3px solid #2a2a3e`,
      boxShadow: `
        0 25px 80px rgba(0, 0, 0, 0.5),
        0 0 40px ${primaryColor}15,
        inset 0 0 0 1px ${primaryColor}10
      `,
      transform: `translateY(${translateY}px) rotateY(${rotateY}deg)`,
      position: 'relative',
    }}>
      {/* Notch */}
      <div style={{
        position: 'absolute',
        top: 8,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 100,
        height: 24,
        backgroundColor: '#0d0d14',
        borderRadius: 12,
        zIndex: 10,
      }} />
      
      {/* Status bar */}
      <div style={{
        padding: '12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 12,
        color: '#888',
      }}>
        <span>9:41</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <span>5G</span>
          <span>100%</span>
        </div>
      </div>
      
      {/* Content */}
      <div style={{
        width: '100%',
        aspectRatio: '9/16',
        padding: '0 4px 4px',
      }}>
        {children}
      </div>
      
      {/* Home indicator */}
      <div style={{
        position: 'absolute',
        bottom: 8,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 100,
        height: 4,
        backgroundColor: '#fff',
        borderRadius: 2,
        opacity: 0.3,
      }} />
    </div>
  );
};

const LaptopFrame: React.FC<{
  children: React.ReactNode;
  primaryColor: string;
}> = ({ children, primaryColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const entrance = spring({ frame, fps, config: { damping: 15 } });
  const translateY = interpolate(entrance, [0, 1], [40, 0]);
  
  return (
    <div style={{
      width: '90%',
      maxWidth: 900,
      transform: `translateY(${translateY}px)`,
    }}>
      {/* Screen */}
      <div style={{
        backgroundColor: '#1a1a2e',
        borderRadius: '12px 12px 0 0',
        overflow: 'hidden',
        border: `1px solid ${primaryColor}30`,
        borderBottom: 'none',
      }}>
        {/* Camera notch */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '8px 0',
          backgroundColor: '#0d0d14',
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#333' }} />
        </div>
        
        {/* Content */}
        <div style={{
          width: '100%',
          aspectRatio: '16/10',
        }}>
          {children}
        </div>
      </div>
      
      {/* Keyboard base */}
      <div style={{
        backgroundColor: '#2a2a3e',
        height: 16,
        borderRadius: '0 0 4px 4px',
        marginLeft: '5%',
        marginRight: '5%',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      }} />
    </div>
  );
};

export const DeviceFrame: React.FC<DeviceFrameProps> = ({
  assetUrl,
  deviceType,
  primaryColor = '#6C5CE7',
  showShadow = true,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames],
    [1, 0],
    { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
  );
  
  const content = (
    <Img
      src={assetUrl}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
      }}
    />
  );
  
  const renderDevice = () => {
    switch (deviceType) {
      case 'browser':
        return <BrowserFrame primaryColor={primaryColor}>{content}</BrowserFrame>;
      case 'phone':
        return <PhoneFrame primaryColor={primaryColor}>{content}</PhoneFrame>;
      case 'laptop':
        return <LaptopFrame primaryColor={primaryColor}>{content}</LaptopFrame>;
      case 'tablet':
        return (
          <div style={{
            width: 400,
            borderRadius: 24,
            overflow: 'hidden',
            backgroundColor: '#1a1a2e',
            border: `2px solid ${primaryColor}30`,
            boxShadow: showShadow ? `0 25px 80px rgba(0, 0, 0, 0.5)` : 'none',
          }}>
            {content}
          </div>
        );
      default:
        return <BrowserFrame primaryColor={primaryColor}>{content}</BrowserFrame>;
    }
  };

  return (
    <AbsoluteFill style={{
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#0a0a12',
      opacity: fadeOut,
    }}>
      {renderDevice()}
    </AbsoluteFill>
  );
};
