export declare const userRoles: readonly ['student', 'moderator', 'admin'];
export type UserRole = (typeof userRoles)[number];

export declare const reportContentTypes: readonly ['group', 'resource'];
export type ReportContentType = (typeof reportContentTypes)[number];

export declare const reportReasons: readonly [
  'Incorrect or misleading',
  'Inappropriate content',
  'Copyright or attribution concern',
  'Spam or duplicate',
  'Other',
];
export type ReportReason = (typeof reportReasons)[number];

export declare const designTokens: {
  readonly color: {
    readonly surface: '#FFFFFF';
    readonly surfaceRaised: '#FFFFFF';
    readonly surfaceSunken: '#F5F7FB';
    readonly borderSubtle: '#E3E8F0';
    readonly borderStrong: '#5E6672';
    readonly controlBorder: '#475569';
    readonly textPrimary: '#0F172A';
    readonly textSecondary: '#475569';
    readonly textMuted: '#64748B';
    readonly brand: '#123C69';
    readonly brandSoft: '#E7F0F8';
    readonly success: '#17643A';
    readonly successSoft: '#E7F4EC';
    readonly warning: '#7A4B00';
    readonly warningSoft: '#FFF3D6';
    readonly danger: '#B42318';
    readonly dangerSoft: '#FDECEA';
    readonly categoryBusiness: '#B45309';
    readonly categoryTechnology: '#4338CA';
    readonly categoryArts: '#BE185D';
    readonly categoryHealth: '#0F766E';
    readonly categoryEngineering: '#475569';
    readonly darkSurface: '#131C2E';
    readonly darkSurfaceRaised: '#1A2540';
    readonly darkSurfaceSunken: '#0B1220';
    readonly darkBorderSubtle: '#26334D';
    readonly darkBorderStrong: '#7183A0';
    readonly darkTextPrimary: '#E6EBF5';
    readonly darkTextSecondary: '#B6C2D9';
    readonly darkTextMuted: '#8FA0BF';
    readonly darkBrand: '#91B9E8';
    readonly darkBrandSoft: '#243B55';
  };
  readonly spacing: Readonly<Record<'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl' | 'section' | 'page', number>>;
  readonly radius: Readonly<Record<'xs' | 'sm' | 'md' | 'lg' | 'full', number>>;
  readonly elevation: Readonly<Record<0 | 1 | 2 | 3, string>>;
  readonly typography: Readonly<Record<'cardTitle' | 'body' | 'meta' | 'overline', number>>;
};

export type CreateContentReportRequest = {
  contentType: ReportContentType;
  contentId: number;
  reason: ReportReason;
  details?: string;
};

export type ContentReportStatus = 'pending' | 'dismissed' | 'removed';
