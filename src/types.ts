export interface User {
  id: string;
  email: string;
  username: string;
  companyName?: string;
  businessType?: string;
  isAdmin?: boolean;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  status: 'Pending' | 'Completed';
  targetDate: string;
}

export interface TradeDeal {
  id: string;
  title: string;
  buyerEmail: string;
  sellerEmail: string;
  amount: number;
  currency: 'USD' | 'Pi' | 'NGN' | 'USDT' | 'USDC';
  paymentStatus: 'Awaiting Payment' | 'Processing' | 'Paid' | 'Disputed' | 'Completed';
  deliveryStatus: 'Not Started' | 'In Progress' | 'Shipped' | 'Delivered' | 'Approved' | 'Disputed';
  milestones: Milestone[];
  terms: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SmartContract {
  id: string;
  templateType: 'Supply Agreement' | 'Service Agreement' | 'Freelance Agreement' | 'NDA' | 'Loan Agreement' | 'Purchase Order' | 'Delivery Agreement';
  partyA: string;
  partyB: string;
  businessA: string;
  businessB: string;
  emailA: string;
  emailB: string;
  scopeOfWork: string;
  deliverables: string;
  price: number;
  paymentTerms: string;
  deliveryTerms: string;
  cancellationTerms: string;
  disputeTerms: string;
  effectiveDate: string;
  docHash: string;
  signatureA?: string;
  signatureB?: string;
  signedAt?: string;
  isFullySigned: boolean;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  sellerName: string;
  sellerDetails: string;
  buyerName: string;
  buyerDetails: string;
  items: InvoiceItem[];
  taxRate: number;
  discountRate: number;
  total: number;
  currency: 'USD' | 'Pi' | 'NGN' | 'USDT' | 'USDC';
  paymentStatus: 'Unpaid' | 'Processing' | 'Paid';
  dueDate: string;
  notes: string;
  payLink: string;
  createdAt: string;
}

export interface DisputeMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
}

export interface DisputeEvidence {
  id: string;
  fileName: string;
  fileType: string;
  uploadedAt: string;
}

export interface Dispute {
  id: string;
  dealId: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED';
  initiator: string;
  reason: string;
  description: string;
  messages: DisputeMessage[];
  evidenceList: DisputeEvidence[];
  resolutionNotes?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  dealId?: string;
  event: string;
  details: string;
  timestamp: string;
}

export interface PaymentDetails {
  method: 'PI' | 'PAYSTACK' | 'FLUTTERWAVE' | 'USDT_BEP20' | 'USDC_BASE';
  currency: string;
  amount: number;
  reference: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  txHash?: string;
  initiatedAt: string;
  verifiedAt?: string;
}
