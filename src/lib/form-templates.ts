export interface FormTemplate {
  id: string
  name: string
  description: string
  category: string
  businessTypes: string[]
  useCases: string[]
  estimatedTime: string
  questions: TemplateQuestion[]
  tags: string[]
  popular?: boolean
}

export interface TemplateQuestion {
  title: string
  description?: string
  type: 'text' | 'textarea' | 'rating' | 'choice' | 'multiselect'
  required: boolean
  options?: string[]
  order_index: number
  rating_scale?: number
}

export const FORM_TEMPLATES: FormTemplate[] = [
  {
    id: 'hospitality_experience',
    name: 'Hospitality Experience Snapshot',
    description: 'Capture how guests felt about service, food, and ambiance in under a minute.',
    category: 'Hospitality',
    businessTypes: ['restaurant', 'other'],
    useCases: ['customer_satisfaction'],
    estimatedTime: '45 seconds',
    popular: true,
    tags: ['service', 'food', 'ambiance'],
    questions: [
      {
        title: 'How satisfied were you with your visit today?',
        type: 'rating',
        required: true,
        rating_scale: 10,
        order_index: 0
      },
      {
        title: 'What stood out to you the most?',
        description: 'Tell us about a positive moment or team member.',
        type: 'textarea',
        required: false,
        order_index: 1
      },
      {
        title: 'Where could we improve for next time?',
        type: 'textarea',
        required: false,
        order_index: 2
      }
    ]
  },
  {
    id: 'retail_checkout_nps',
    name: 'Retail Checkout NPS Pulse',
    description: 'Measure how likely shoppers are to recommend you after checkout and why.',
    category: 'Retail',
    businessTypes: ['retail'],
    useCases: ['nps', 'customer_satisfaction'],
    estimatedTime: '30 seconds',
    tags: ['checkout', 'nps', 'retail'],
    questions: [
      {
        title: 'How likely are you to recommend us to a friend?',
        type: 'rating',
        required: true,
        rating_scale: 10,
        order_index: 0
      },
      {
        title: 'What was the main reason for your score?',
        type: 'textarea',
        required: false,
        order_index: 1
      },
      {
        title: 'Did you find what you came in for today?',
        type: 'choice',
        required: false,
        options: ['Yes, everything', 'Mostly', 'Not really'],
        order_index: 2
      }
    ]
  },
  {
    id: 'service_team_feedback',
    name: 'Service Team Touchpoint',
    description: 'Understand how recent support interactions felt from the customer perspective.',
    category: 'Support',
    businessTypes: ['corporate', 'other'],
    useCases: ['customer_satisfaction', 'support'],
    estimatedTime: '40 seconds',
    tags: ['support', 'service', 'team'],
    questions: [
      {
        title: 'How would you rate the help you received?',
        type: 'rating',
        required: true,
        rating_scale: 10,
        order_index: 0
      },
      {
        title: 'Did we resolve your issue today?',
        type: 'choice',
        required: true,
        options: ['Yes, completely', 'Partially', 'Not yet'],
        order_index: 1
      },
      {
        title: 'What could we do better next time?',
        type: 'textarea',
        required: false,
        order_index: 2
      }
    ]
  },
  {
    id: 'employee_pulse',
    name: 'Employee Pulse Check',
    description: 'Keep a pulse on team morale with a lightweight weekly check-in.',
    category: 'Employee Experience',
    businessTypes: ['corporate'],
    useCases: ['employee_engagement'],
    estimatedTime: '60 seconds',
    tags: ['employee', 'engagement', 'internal'],
    questions: [
      {
        title: 'How was your week overall?',
        type: 'rating',
        required: true,
        rating_scale: 10,
        order_index: 0
      },
      {
        title: 'What went surprisingly well?',
        type: 'textarea',
        required: false,
        order_index: 1
      },
      {
        title: 'Anything blocking you that we should know about?',
        type: 'textarea',
        required: false,
        order_index: 2
      }
    ]
  },
  {
    id: 'quick_event_recap',
    name: 'Event Recap Snapshot',
    description: 'Collect fast feedback after workshops or meetups while memories are fresh.',
    category: 'Events',
    businessTypes: ['other', 'corporate'],
    useCases: ['event_feedback'],
    estimatedTime: '45 seconds',
    tags: ['events', 'meetup', 'recap'],
    questions: [
      {
        title: "How would you rate today's session overall?",
        type: 'rating',
        required: true,
        rating_scale: 10,
        order_index: 0
      },
      {
        title: 'What was the highlight for you?',
        type: 'textarea',
        required: false,
        order_index: 1
      },
      {
        title: 'What should we improve for next time?',
        type: 'textarea',
        required: false,
        order_index: 2
      }
    ]
  }
];

export const getTemplateById = (id: string) =>
  FORM_TEMPLATES.find(template => template.id === id);
