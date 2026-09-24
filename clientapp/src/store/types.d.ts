
export interface ClaimsIdentity {
    clientPrincipal: ClientPrincipal;
}

export interface ClientPrincipal {
    userId:           string;
    userRoles:        string[];
    claims:           any[];
    identityProvider: string;
    userDetails:      string;
}

export interface WpPage {
    id:             number;
    date:           Date;
    date_gmt:       Date;
    guid:           GUID;
    modified:       Date;
    modified_gmt:   Date;
    slug:           string;
    status:         string;
    type:           string;
    link:           string;
    title:          Title;
    content:        Content;
    excerpt:        Content;
    author:         number;
    featured_media: number;
    parent:         number;
    menu_order:     number;
    comment_status: string;
    ping_status:    string;
    template:       string;
    meta:           Meta;
    _links:         WpPageLinks;
}

export interface WpPageLinks {
    self:                  About[];
    collection:            About[];
    about:                 About[];
    author:                Author[];
    replies:               Author[];
    "version-history":     VersionHistory[];
    "predecessor-version": PredecessorVersion[];
    "wp:attachment":       About[];
    curies:                Cury[];
}

export interface WpPost {
    id:             number;
    date:           Date;
    date_gmt:       Date;
    guid:           GUID;
    modified:       Date;
    modified_gmt:   Date;
    slug:           string;
    status:         string;
    type:           string;
    link:           string;
    title:          GUID;
    content:        Content;
    excerpt:        Content;
    author:         number;
    featured_media: number;
    comment_status: string;
    ping_status:    string;
    sticky:         boolean;
    template:       string;
    format:         string;
    meta:           Meta;
    categories:     number[];
    tags:           any[];
    _links:         WpPostLinks;
}

export interface WpPostLinks {
    self:              About[];
    collection:        About[];
    about:             About[];
    author:            Author[];
    replies:           Author[];
    "version-history": VersionHistory[];
    "wp:attachment":   About[];
    "wp:term":         WpTerm[];
    curies:            Cury[];
}

export interface WpTag {
    id:          number;
    count:       number;
    description: string;
    link:        string;
    name:        string;
    slug:        string;
    taxonomy:    string;
    meta:        any[];
    _links:      WpTagLinks;
}

export interface WpTagLinks {
    self:           About[];
    collection:     About[];
    about:          About[];
    "wp:post_type": About[];
    curies:         Cury[];
}

export interface WpCategory {
    id:          number;
    count:       number | undefined;
    description: string;
    link:        string | undefined;
    name:        string;
    slug:        string | undefined;
    taxonomy:    Taxonomy | undefined;
    parent:      number;
    meta:        any[] | undefined;
    _links:      WpCategoryLinks | undefined;
}

export interface WpCategoryLinks {
    self:           About[];
    collection:     About[];
    about:          About[];
    up?:            Up[];
    "wp:post_type": About[];
    curies:         Cury[];
}

export interface About {
    href: string;
}

export interface Author {
    embeddable: boolean;
    href:       string;
}

export interface Cury {
    name:      string;
    href:      string;
    templated: boolean;
}

export interface PredecessorVersion {
    id:   number;
    href: string;
}

export interface VersionHistory {
    count: number;
    href:  string;
}

export interface Content {
    rendered:  string;
    protected: boolean;
}

export interface GUID {
    rendered: string;
}

export interface Title {
    rendered: string;
}

export interface Meta {
    footnotes: string;
}

export interface WpTerm {
    taxonomy:   string;
    embeddable: boolean;
    href:       string;
}

export interface Up {
    embeddable: boolean;
    href:       string;
}

export enum Taxonomy {
    Category = "category",
}

export interface IncomeSourcesResponse {
  incomeSources: IncomeSourceSummary[];
  monthlyTimeline: MonthlyTimeline;
  monthlyTimelineList: MonthlyTimeline[];
  totalPaid: number;
  totalDue: number;
  totalOverdue: number;
  nextDueDate: string;
}

export interface IncomeSourceSummary {
  incomeSource: IncomeSource;
  incomePayments: IncomePayment[];
  monthlyTimeline: MonthlyTimeline;
  dueDate: string;
  pastDueDate: string;
  currentMonthPaymentTotal: number;
  currentMonthPaid: boolean;
  currentMonthPastDue: boolean;
  paymentHistory: PaymentHistoryItem[];
}

export interface IncomeSource {
  incomeSourceId: number;
  institutionAccessItemId: number;
  name: string;
  description: string;
  startDate: string | Date | null; // ISO date string
  endDate: string | Date | null;   // ISO date string
  amountDue: number;
  dayOfMonthDue: number;
  incomeSourceType: string;
  expectedPaymentMemos: string[];
  isExisting: boolean;
}

export interface IncomePayment {
  incomePaymentId: number;
  transactionId: string;
  incomeSourceId: number;
  incomeSourceName: string;
  paymentDate: string; // ISO date string
  amount: number;
  paymentMemo: string;
  isManualAdjustment: boolean;
  isExisting: boolean;
}

export interface MonthlyTimeline {
  text: string;
  month: number;
  year: number;
  startOfMonth: string; // ISO date string
  endOfMonth: string;   // ISO date string
}

export interface PaymentHistoryItem {
  month: string;
  year: number;
  paidAmount: number;
  amountDue: number;
  dueDate: string; // ISO date string
}

export interface IncomeSourceSummary {
  incomeSource: IncomeSource;
  incomePayments: IncomePayment[];
  monthlyTimeline: MonthlyTimeline;
  dueDate: string;       // ISO date string
  pastDueDate: string;   // ISO date string
  currentMonthPaymentTotal: number;
  currentMonthPaid: boolean;
  currentMonthPastDue: boolean;
  paymentHistory: PaymentHistoryItem[];
}

export interface Account {
  account_id: string;
  mask: string;
  name: string;
  official_name: string;
  subtype: string;
  type: string;
}

export interface Transaction {
  date: string; // YYYY-MM-DD
  name: string;
  amount: number;
  transaction_id: string;
  pending: boolean;
  authorized_date: string | null; // YYYY-MM-DD or null
  transaction_type: string;
  payment_channel: string;
  merchant_name: string | null;
  account_id: string;
  hasTransactionCategory: boolean;
  category: string | null;
  account: Account;
  incomePayment: any | null; // Specify shape if known
  monthlyTimeline: MonthlyTimeline;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  expired: boolean;
  institutionName: string;
}