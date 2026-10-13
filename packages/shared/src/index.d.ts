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

export type CreateContentReportRequest = {
  contentType: ReportContentType;
  contentId: number;
  reason: ReportReason;
  details?: string;
};

export type ContentReportStatus = 'pending' | 'dismissed' | 'removed';
