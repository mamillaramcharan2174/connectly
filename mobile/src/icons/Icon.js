import React from 'react';
import { View } from 'react-native';

/**
 * Connectly Original Vector Iconography
 * Rendered using lightweight standard SVG elements (compatible across Web and Native)
 */

export default function Icon({ name, size = 24, color = '#FFFFFF', strokeWidth = 2, style }) {
  const renderPath = () => {
    switch (name) {
      // Connectly Pulse Logo: Interconnected circular nodes with an ambient wave
      case 'logo':
        return (
          <>
            <circle cx="8" cy="12" r="4.5" stroke={color} strokeWidth={strokeWidth} fill="none" />
            <circle cx="16" cy="12" r="4.5" stroke={color} strokeWidth={strokeWidth} fill="none" />
            <path d="M12 4.5V19.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <circle cx="12" cy="12" r="2" fill={color} />
          </>
        );

      case 'home':
        return (
          <path
            d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H15C14.4477 21 14 20.5523 14 20V15C14 14.4477 13.5523 14 13 14H11C10.4477 14 10 14.4477 10 15V20C10 20.5523 9.55228 21 9 21H4C3.44772 21 3 20.5523 3 20V10.5Z"
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );

      case 'home-filled':
        return (
          <path
            d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H15C14.4477 21 14 20.5523 14 20V15C14 14.4477 13.5523 14 13 14H11C10.4477 14 10 14.4477 10 15V20C10 20.5523 9.55228 21 9 21H4C3.44772 21 3 20.5523 3 20V10.5Z"
            fill={color}
          />
        );

      case 'search':
        return (
          <>
            <circle cx="11" cy="11" r="7" stroke={color} strokeWidth={strokeWidth} fill="none" />
            <path d="M16.5 16.5L21 21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          </>
        );

      case 'search-filled':
        return (
          <>
            <circle cx="11" cy="11" r="7.5" fill={color} />
            <path d="M16.5 16.5L21 21" stroke={color} strokeWidth={strokeWidth + 1} strokeLinecap="round" />
          </>
        );

      // Create Orbit Plus
      case 'create':
        return (
          <>
            <rect x="3" y="3" width="18" height="18" rx="6" stroke={color} strokeWidth={strokeWidth} fill="none" />
            <path d="M12 8V16M8 12H16" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          </>
        );

      case 'create-filled':
        return (
          <>
            <rect x="3" y="3" width="18" height="18" rx="6" fill={color} />
            <path d="M12 8V16M8 12H16" stroke="#0B0F17" strokeWidth={strokeWidth + 0.5} strokeLinecap="round" />
          </>
        );

      case 'bell':
        return (
          <path
            d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21S18 15 18 8M13.73 21A2 2 0 0 1 10.27 21"
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );

      case 'bell-filled':
        return (
          <path
            d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21S18 15 18 8M13.73 21A2 2 0 0 1 10.27 21"
            fill={color}
            stroke={color}
            strokeWidth={1}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );

      case 'profile':
        return (
          <>
            <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="none" />
            <circle cx="12" cy="7" r="4" stroke={color} strokeWidth={strokeWidth} fill="none" />
          </>
        );

      case 'profile-filled':
        return (
          <>
            <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" fill={color} />
            <circle cx="12" cy="7" r="4.5" fill={color} />
          </>
        );

      case 'chat':
        return (
          <path
            d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0034 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z"
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );

      case 'chat-filled':
        return (
          <path
            d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0034 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z"
            fill={color}
          />
        );

      case 'heart':
        return (
          <path
            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );

      case 'heart-filled':
        return (
          <path
            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
            fill={color || '#EF4444'}
          />
        );

      case 'comment':
        return (
          <path
            d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );

      case 'share':
        return (
          <path
            d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );

      case 'bookmark':
        return (
          <path
            d="M19 21L12 16L5 21V5C5 3.89543 5.89543 3 7 3H17C18.1046 3 19 3.89543 19 5V21Z"
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );

      case 'bookmark-filled':
        return (
          <path
            d="M19 21L12 16L5 21V5C5 3.89543 5.89543 3 7 3H17C18.1046 3 19 3.89543 19 5V21Z"
            fill={color}
          />
        );

      case 'more':
        return (
          <>
            <circle cx="5" cy="12" r="1.75" fill={color} />
            <circle cx="12" cy="12" r="1.75" fill={color} />
            <circle cx="19" cy="12" r="1.75" fill={color} />
          </>
        );

      case 'mic':
        return (
          <>
            <rect x="9" y="2" width="6" height="12" rx="3" stroke={color} strokeWidth={strokeWidth} fill="none" />
            <path d="M5 10C5 13.866 8.13401 17 12 17C15.866 17 19 13.866 19 10" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <line x1="12" y1="17" x2="12" y2="22" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <line x1="8" y1="22" x2="16" y2="22" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          </>
        );

      case 'camera':
        return (
          <>
            <path d="M23 19C23 20.1 22.1 21 21 21H3C1.9 21 1 20.1 1 19V8C1 6.9 1.9 6 3 6H7L9 3H15L17 6H21C22.1 6 23 6.9 23 8V19Z" stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinejoin="round" />
            <circle cx="12" cy="13" r="4" stroke={color} strokeWidth={strokeWidth} fill="none" />
          </>
        );

      case 'play':
        return <polygon points="6 3 20 12 6 21 6 3" fill={color} />;

      case 'pause':
        return (
          <>
            <rect x="6" y="4" width="4" height="16" rx="1" fill={color} />
            <rect x="14" y="4" width="4" height="16" rx="1" fill={color} />
          </>
        );

      case 'send':
        return (
          <path
            d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );

      case 'check':
        return <path d="M20 6L9 17L4 12" stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" />;

      case 'double-check':
        return (
          <>
            <path d="M17 6L7 16L2 11" stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M22 6L12 16L9.5 13.5" stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </>
        );

      case 'close':
        return <path d="M18 6L6 18M6 6L18 18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />;

      case 'back':
        return <path d="M19 12H5M12 19L5 12L12 5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />;

      case 'sun':
        return (
          <>
            <circle cx="12" cy="12" r="5" stroke={color} strokeWidth={strokeWidth} fill="none" />
            <line x1="12" y1="1" x2="12" y2="3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <line x1="12" y1="21" x2="12" y2="23" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <line x1="1" y1="12" x2="3" y2="12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <line x1="21" y1="12" x2="23" y2="12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          </>
        );

      case 'moon':
        return (
          <path
            d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );

      case 'shield':
        return (
          <path
            d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );

      case 'trash':
        return (
          <>
            <polyline points="3 6 5 6 21 6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </>
        );

      case 'edit':
        return (
          <path
            d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );

      case 'location':
        return (
          <>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke={color} strokeWidth={strokeWidth} fill="none" />
            <circle cx="12" cy="10" r="3" stroke={color} strokeWidth={strokeWidth} fill="none" />
          </>
        );

      case 'verified':
        return (
          <>
            <path d="M12 2l2.4 2.5 3.4-.6 1.3 3.2 3.1 1.6-.7 3.4 2.1 2.8-2.1 2.8.7 3.4-3.1 1.6-1.3 3.2-3.4-.6L12 22l-2.4-2.5-3.4.6-1.3-3.2-3.1-1.6.7-3.4-2.1-2.8 2.1-2.8-.7-3.4 3.1-1.6 1.3-3.2 3.4.6L12 2z" fill={color || '#06B6D4'} />
            <polyline points="9 12 11 14 15 10" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </>
        );

      default:
        return <circle cx="12" cy="12" r="10" stroke={color} strokeWidth={strokeWidth} fill="none" />;
    }
  };

  return (
    <View style={[{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }, style]}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%' }}
      >
        {renderPath()}
      </svg>
    </View>
  );
}
