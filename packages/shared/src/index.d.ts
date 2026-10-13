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
    readonly surfaceSunken: '#F4F7FA';
    readonly borderSubtle: '#767676';
    readonly borderStrong: '#5E6672';
    readonly textPrimary: '#17202A';
    readonly textSecondary: '#46515E';
    readonly textMuted: '#5D6672';
    readonly brand: '#123C69';
    readonly brandSoft: '#E7F0F8';
    readonly success: '#17643A';
    readonly successSoft: '#E7F4EC';
    readonly warning: '#7A4B00';
    readonly warningSoft: '#FFF3D6';
    readonly danger: '#B42318';
    readonly dangerSoft: '#FDECEA';
    readonly categoryBusiness: '#8A5000';
    readonly categoryTechnology: '#3448A5';
    readonly categoryArts: '#A12D52';
    readonly categoryHealth: '#08736E';
    readonly categoryEngineering: '#34505F';
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
