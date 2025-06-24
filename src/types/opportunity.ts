export interface Opportunity {
  id?: string;
  title: string;
  organization: string;
  description: string;
  location: string;
  type: "travel" | "career" | "education";
  category: string;
  duration: string;
  deadline: string;
  imageUrl: string;
  tags?: string[];
  dates?: string;
}

export interface UserOpportunity extends Opportunity {
  applicationStatus:
    | "pending"
    | "reviewing"
    | "interview"
    | "accepted"
    | "rejected";
  appliedDate: string;
  progress: number;
}
