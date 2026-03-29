// @repo/ui — Shared UI components built on shadcn/ui primitives

// Utilities
export { cn } from "./utils";

// Layout
export { PageHeader } from "./components/page-header";
export { EmptyState } from "./components/empty-state";
export { LoadingSkeleton, Skeleton } from "./components/loading-skeleton";

// Data display
export { StatCard } from "./components/stat-card";
export { StatusBadge } from "./components/status-badge";
export type { ConversationStatus } from "./components/status-badge";
export { ChannelBadge } from "./components/channel-badge";
export type { Channel } from "./components/channel-badge";
export { DataTable } from "./components/data-table";
export type { Column, DataTableProps } from "./components/data-table";
export { CopyButton } from "./components/copy-button";

// Forms & feedback
export { FormSection } from "./components/form-section";
export { ConfirmDialog } from "./components/confirm-dialog";

// Navigation
export { Breadcrumb } from "./components/breadcrumb";
export type { BreadcrumbItem } from "./components/breadcrumb";
