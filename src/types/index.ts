export interface ContactSubmission {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  image: string;
  initials: string;
  links: { label: string; url: string }[];
}

export interface Client {
  id: string;
  name: string;
  industry: string;
  icon: string;
  tag: string;
  featured: boolean;
}

export interface Service {
  id: string;
  num: string;
  title: string;
  description: string;
  icon: string;
  tags: string[];
}
