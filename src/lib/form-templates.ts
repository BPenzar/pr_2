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
    id: 'ugostiteljstvo_dozivljaj_blic',
    name: 'Blic doživljaj posjeta',
    description: 'U minuti doznajte kako su gosti doživjeli uslugu, hranu i ambijent.',
    category: 'Hospitality',
    businessTypes: ['restaurant', 'other'],
    useCases: ['customer_satisfaction'],
    estimatedTime: '45 sekundi',
    popular: true,
    tags: ['ugostiteljstvo', 'restoran', 'doživljaj', 'povratak'],
    questions: [
      {
        title: 'Koliko ste zadovoljni današnjim posjetom?',
        description: 'Ocijenite ukupni doživljaj (usluga, hrana, ambijent).',
        type: 'rating',
        required: true,
        rating_scale: 10,
        order_index: 0
      },
      {
        title: 'Što bismo mogli poboljšati za idući put?',
        type: 'textarea',
        required: false,
        order_index: 1
      },
      {
        title: 'Koliko je vjerojatno da ćete nam se vratiti?',
        description: 'Odaberite signal povratka.',
        type: 'choice',
        required: true,
        options: [
          'Zeleno | green',
          'Žuto | yellow',
          'Crveno | red'
        ],
        order_index: 2
      }
    ]
  },
  {
    id: 'hospitality_experience_snapshot',
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
        title: 'Which part of your visit stood out the most?',
        description: 'Tell us about a memorable moment or team member.',
        type: 'textarea',
        required: false,
        order_index: 1
      },
      {
        title: 'Where could we improve for next time?',
        type: 'textarea',
        required: false,
        order_index: 2
      },
      {
        title: 'How likely are you to return?',
        type: 'choice',
        required: true,
        options: ['Very likely', 'Maybe', 'Not likely'],
        order_index: 3
      }
    ]
  },
  {
    id: 'retail_checkout_pulse',
    name: 'Retail Checkout Pulse',
    description: 'Measure how likely shoppers are to recommend you after checkout and why.',
    category: 'Retail',
    businessTypes: ['retail'],
    useCases: ['nps', 'customer_satisfaction'],
    estimatedTime: '35 seconds',
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
        title: 'Did you find what you were looking for today?',
        type: 'choice',
        required: true,
        options: ['Yes, everything', 'Mostly', 'Not really'],
        order_index: 1
      },
      {
        title: 'What was the highlight of your visit?',
        type: 'textarea',
        required: false,
        order_index: 2
      },
      {
        title: 'What could we improve in the checkout experience?',
        type: 'textarea',
        required: false,
        order_index: 3
      }
    ]
  },
  {
    id: 'service_team_touchpoint',
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
        rating_scale: 5,
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
        title: 'How long did it take to get help?',
        type: 'choice',
        required: false,
        options: ['Under 5 minutes', '5-15 minutes', 'Longer than 15 minutes'],
        order_index: 2
      },
      {
        title: 'What could we do better next time?',
        type: 'textarea',
        required: false,
        order_index: 3
      }
    ]
  },
  {
    id: 'employee_pulse_check',
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
      },
      {
        title: 'Do you feel supported by your team lead?',
        type: 'choice',
        required: true,
        options: ['Yes', 'Somewhat', 'Not really'],
        order_index: 3
      }
    ]
  },
  {
    id: 'event_recap_snapshot',
    name: 'Event Recap Snapshot',
    description: 'Collect fast feedback after workshops or meetups while memories are fresh.',
    category: 'Events',
    businessTypes: ['corporate', 'other'],
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
        title: 'How likely are you to attend another event with us?',
        type: 'choice',
        required: true,
        options: ['Very likely', 'Maybe', 'Not likely'],
        order_index: 2
      },
      {
        title: 'What should we improve for next time?',
        type: 'textarea',
        required: false,
        order_index: 3
      }
    ]
  },
  {
    id: 'healthcare_visit_feedback',
    name: 'Healthcare Visit Feedback',
    description: 'Understand patient experience after appointments or treatments.',
    category: 'Healthcare',
    businessTypes: ['healthcare', 'other'],
    useCases: ['customer_satisfaction'],
    estimatedTime: '50 seconds',
    tags: ['patient', 'clinic', 'wellness'],
    questions: [
      {
        title: 'How would you rate the quality of care you received?',
        type: 'rating',
        required: true,
        rating_scale: 5,
        order_index: 0
      },
      {
        title: 'How satisfied were you with the wait time?',
        type: 'choice',
        required: true,
        options: ['Very satisfied', 'Neutral', 'Unsatisfied'],
        order_index: 1
      },
      {
        title: 'Did the staff explain things clearly?',
        type: 'choice',
        required: true,
        options: ['Yes', 'Somewhat', 'No'],
        order_index: 2
      },
      {
        title: 'Anything else you would like us to know?',
        type: 'textarea',
        required: false,
        order_index: 3
      }
    ]
  },
  {
    id: 'saas_onboarding_checkin',
    name: 'SaaS Onboarding Check-in',
    description: 'Gauge how new users feel after their first week inside your product.',
    category: 'Software',
    businessTypes: ['corporate', 'other'],
    useCases: ['product_feedback', 'customer_satisfaction'],
    estimatedTime: '55 seconds',
    tags: ['saas', 'onboarding', 'retention'],
    questions: [
      {
        title: 'How easy has it been to get started?',
        type: 'rating',
        required: true,
        rating_scale: 10,
        order_index: 0
      },
      {
        title: 'Which features have you tried so far?',
        type: 'multiselect',
        required: false,
        options: ['Dashboards', 'Automations', 'Integrations', 'Reports'],
        order_index: 1
      },
      {
        title: 'Do you feel confident using the product?',
        type: 'choice',
        required: true,
        options: ['Yes', 'Somewhat', 'Not yet'],
        order_index: 2
      },
      {
        title: 'What would make onboarding smoother?',
        type: 'textarea',
        required: false,
        order_index: 3
      }
    ]
  },
  {
    id: 'education_course_exit',
    name: 'Course Exit Pulse',
    description: 'Gather quick feedback when learners finish a course or module.',
    category: 'Education',
    businessTypes: ['other', 'corporate'],
    useCases: ['event_feedback', 'product_feedback'],
    estimatedTime: '45 seconds',
    tags: ['education', 'training', 'learning'],
    questions: [
      {
        title: 'How valuable was this course overall?',
        type: 'rating',
        required: true,
        rating_scale: 10,
        order_index: 0
      },
      {
        title: 'How confident do you feel applying what you learned?',
        type: 'choice',
        required: true,
        options: ['Very confident', 'Somewhat confident', 'Not confident'],
        order_index: 1
      },
      {
        title: 'Which topics should we dive deeper into?',
        type: 'textarea',
        required: false,
        order_index: 2
      },
      {
        title: 'Would you recommend this course to others?',
        type: 'choice',
        required: true,
        options: ['Yes', 'Maybe', 'No'],
        order_index: 3
      }
    ]
  },
  {
    id: 'fitness_class_feedback',
    name: 'Fitness Class Feedback',
    description: 'Check how participants felt after a class or training session.',
    category: 'Fitness & Wellness',
    businessTypes: ['other'],
    useCases: ['customer_satisfaction', 'event_feedback'],
    estimatedTime: '40 seconds',
    tags: ['fitness', 'gym', 'wellness'],
    questions: [
      {
        title: 'How energized do you feel after the session?',
        type: 'rating',
        required: true,
        rating_scale: 5,
        order_index: 0
      },
      {
        title: 'How would you rate the instructor?',
        type: 'rating',
        required: true,
        rating_scale: 5,
        order_index: 1
      },
      {
        title: 'Which part of the class did you enjoy most?',
        type: 'textarea',
        required: false,
        order_index: 2
      },
      {
        title: 'Would you attend this class again?',
        type: 'choice',
        required: true,
        options: ['Definitely', 'Maybe', 'Not this one'],
        order_index: 3
      }
    ]
  },
  {
    id: 'hotel_guest_stay_review',
    name: 'Hotel Guest Stay Review',
    description: 'Understand how guests experienced their stay across key touchpoints.',
    category: 'Hospitality',
    businessTypes: ['restaurant', 'other'],
    useCases: ['customer_satisfaction'],
    estimatedTime: '60 seconds',
    tags: ['hotel', 'stay', 'lodging'],
    questions: [
      {
        title: 'How would you rate your overall stay?',
        type: 'rating',
        required: true,
        rating_scale: 10,
        order_index: 0
      },
      {
        title: 'How satisfied were you with room cleanliness?',
        type: 'choice',
        required: true,
        options: ['Very satisfied', 'Satisfied', 'Needs attention'],
        order_index: 1
      },
      {
        title: 'Did our team feel welcoming?',
        type: 'choice',
        required: true,
        options: ['Absolutely', 'Mostly', 'Not really'],
        order_index: 2
      },
      {
        title: 'Which amenities did you use?',
        type: 'multiselect',
        required: false,
        options: ['Spa', 'Gym', 'Restaurant', 'Room service', 'Pool'],
        order_index: 3
      },
      {
        title: 'Any suggestions to improve your next stay?',
        type: 'textarea',
        required: false,
        order_index: 4
      }
    ]
  }
];

export const getTemplateById = (id: string) =>
  FORM_TEMPLATES.find(template => template.id === id);
