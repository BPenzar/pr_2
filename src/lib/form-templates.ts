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
    id: 'restaurant_feedback',
    name: 'Restaurant Customer Feedback',
    description: 'Collect comprehensive feedback about dining experience, food quality, and service',
    category: 'Restaurant',
    businessTypes: ['restaurant'],
    useCases: ['customer_satisfaction'],
    estimatedTime: '2-3 minutes',
    popular: true,
    tags: ['food', 'service', 'dining', 'popular'],
    questions: [
      {
        title: 'How would you rate your overall dining experience?',
        type: 'rating',
        required: true,
        rating_scale: 10,
        order_index: 0
      },
      {
        title: 'How was the quality of your food?',
        type: 'rating',
        required: true,
        rating_scale: 10,
        order_index: 1
      },
      {
        title: 'How would you rate our service?',
        type: 'rating',
        required: true,
        rating_scale: 10,
        order_index: 2
      },
      {
        title: 'How clean and comfortable was our restaurant?',
        type: 'rating',
        required: false,
        rating_scale: 10,
        order_index: 3
      },
      {
        title: 'Which menu items did you order today?',
        type: 'multiselect',
        required: false,
        options: ['Appetizers', 'Main Course', 'Desserts', 'Beverages', 'Specials'],
        order_index: 4
      },
      {
        title: 'What did you like most about your visit?',
        type: 'textarea',
        required: false,
        order_index: 5
      },
      {
        title: 'How can we improve your experience?',
        type: 'textarea',
        required: false,
        order_index: 6
      },
      {
        title: 'Would you recommend us to friends and family?',
        type: 'choice',
        required: true,
        options: ['Definitely', 'Probably', 'Maybe', 'Probably Not', 'Definitely Not'],
        order_index: 7
      }
    ]
  },
  {
    id: 'retail_experience',
    name: 'Retail Shopping Experience',
    description: 'Gather feedback on product selection, store experience, and customer service',
    category: 'Retail',
    businessTypes: ['retail'],
    useCases: ['customer_satisfaction', 'product_feedback'],
    estimatedTime: '2 minutes',
    tags: ['shopping', 'products', 'store'],
    questions: [
      {
        title: 'How satisfied are you with your shopping experience today?',
        type: 'rating',
        required: true,
        rating_scale: 10,
        order_index: 0
      },
      {
        title: 'How would you rate our product selection?',
        type: 'rating',
        required: true,
        rating_scale: 10,
        order_index: 1
      },
      {
        title: 'How helpful was our staff?',
        type: 'rating',
        required: true,
        rating_scale: 10,
        order_index: 2
      },
      {
        title: 'What type of products were you looking for today?',
        type: 'multiselect',
        required: false,
        options: ['Clothing', 'Electronics', 'Home & Garden', 'Beauty', 'Sports', 'Books'],
        order_index: 3
      },
      {
        title: 'Did you find everything you were looking for?',
        type: 'choice',
        required: true,
        options: ['Yes, everything', 'Most items', 'Some items', 'Very little', 'Nothing'],
        order_index: 4
      },
      {
        title: 'How was the checkout process?',
        type: 'choice',
        required: false,
        options: ['Very quick', 'Reasonable', 'A bit slow', 'Too slow'],
        order_index: 5
      },
      {
        title: 'Any suggestions for improvement?',
        type: 'textarea',
        required: false,
        order_index: 6
      }
    ]
  },
  {
    id: 'event_feedback',
    name: 'Event Feedback Survey',
    description: 'Collect attendee feedback for conferences, workshops, meetings, and events',
    category: 'Events',
    businessTypes: ['corporate', 'other'],
    useCases: ['event_feedback'],
    estimatedTime: '3 minutes',
    popular: true,
    tags: ['events', 'conferences', 'workshops', 'popular'],
    questions: [
      {
        title: 'How would you rate this event overall?',
        type: 'rating',
        required: true,
        rating_scale: 10,
        order_index: 0
      },
      {
        title: 'How relevant was the content to your needs?',
        type: 'rating',
        required: true,
        rating_scale: 10,
        order_index: 1
      },
      {
        title: 'How would you rate the speakers/presenters?',
        type: 'rating',
        required: true,
        rating_scale: 10,
        order_index: 2
      },
      {
        title: 'How was the venue and facilities?',
        type: 'rating',
        required: false,
        rating_scale: 10,
        order_index: 3
      },
      {
        title: 'Which sessions did you attend?',
        type: 'multiselect',
        required: false,
        options: ['Opening Keynote', 'Technical Sessions', 'Panel Discussion', 'Networking', 'Closing Remarks'],
        order_index: 4
      },
      {
        title: 'What was the most valuable part of the event?',
        type: 'textarea',
        required: false,
        order_index: 5
      },
      {
        title: 'How can we improve future events?',
        type: 'textarea',
        required: false,
        order_index: 6
      },
      {
        title: 'How likely are you to attend similar events in the future?',
        type: 'choice',
        required: true,
        options: ['Very likely', 'Likely', 'Neutral', 'Unlikely', 'Very unlikely'],
        order_index: 7
      }
    ]
  },
  {
    id: 'employee_satisfaction',
    name: 'Employee Satisfaction Survey',
    description: 'Measure employee engagement, satisfaction, and workplace culture',
    category: 'HR',
    businessTypes: ['corporate'],
    useCases: ['employee_engagement'],
    estimatedTime: '4 minutes',
    tags: ['employees', 'hr', 'workplace', 'culture'],
    questions: [
      {
        title: 'How satisfied are you with your current role?',
        type: 'rating',
        required: true,
        rating_scale: 10,
        order_index: 0
      },
      {
        title: 'How would you rate your work-life balance?',
        type: 'rating',
        required: true,
        rating_scale: 10,
        order_index: 1
      },
      {
        title: 'How satisfied are you with your direct manager?',
        type: 'rating',
        required: true,
        rating_scale: 10,
        order_index: 2
      },
      {
        title: 'How would you rate communication within the company?',
        type: 'rating',
        required: true,
        rating_scale: 10,
        order_index: 3
      },
      {
        title: 'Which areas are most important to you? (Select all that apply)',
        type: 'multiselect',
        required: false,
        options: ['Career Development', 'Compensation', 'Benefits', 'Work Environment', 'Team Collaboration', 'Recognition'],
        order_index: 4
      },
      {
        title: 'What do you enjoy most about working here?',
        type: 'textarea',
        required: false,
        order_index: 5
      },
      {
        title: 'What could we improve to make this a better place to work?',
        type: 'textarea',
        required: false,
        order_index: 6
      },
      {
        title: 'How likely are you to recommend this company as a place to work?',
        type: 'rating',
        required: true,
        rating_scale: 10,
        order_index: 7
      }
    ]
  },
  {
    id: 'healthcare_patient',
    name: 'Patient Experience Survey',
    description: 'Collect feedback on healthcare services, appointment experience, and care quality',
    category: 'Healthcare',
    businessTypes: ['healthcare'],
    useCases: ['customer_satisfaction'],
    estimatedTime: '3 minutes',
    tags: ['healthcare', 'patient', 'medical', 'care'],
    questions: [
      {
        title: 'How would you rate your overall experience today?',
        type: 'rating',
        required: true,
        rating_scale: 10,
        order_index: 0
      },
      {
        title: 'How easy was it to schedule your appointment?',
        type: 'rating',
        required: true,
        rating_scale: 10,
        order_index: 1
      },
      {
        title: 'How would you rate the quality of care you received?',
        type: 'rating',
        required: true,
        rating_scale: 10,
        order_index: 2
      },
      {
        title: 'How courteous and helpful was our staff?',
        type: 'rating',
        required: true,
        rating_scale: 10,
        order_index: 3
      },
      {
        title: 'How clean and comfortable were our facilities?',
        type: 'rating',
        required: false,
        rating_scale: 10,
        order_index: 4
      },
      {
        title: 'How long did you wait for your appointment?',
        type: 'choice',
        required: false,
        options: ['No wait', 'Less than 15 min', '15-30 min', '30-60 min', 'More than 1 hour'],
        order_index: 5
      },
      {
        title: 'What did we do well during your visit?',
        type: 'textarea',
        required: false,
        order_index: 6
      },
      {
        title: 'How can we improve your experience?',
        type: 'textarea',
        required: false,
        order_index: 7
      }
    ]
  },
  {
    id: 'product_feedback_simple',
    name: 'Simple Product Feedback',
    description: 'Quick and easy product feedback form for any business',
    category: 'Product',
    businessTypes: ['retail', 'corporate', 'other'],
    useCases: ['product_feedback'],
    estimatedTime: '1 minute',
    tags: ['product', 'quick', 'simple'],
    questions: [
      {
        title: 'How satisfied are you with our product/service?',
        type: 'rating',
        required: true,
        rating_scale: 10,
        order_index: 0
      },
      {
        title: 'What did you like most about it?',
        type: 'textarea',
        required: false,
        order_index: 1
      },
      {
        title: 'What could we improve?',
        type: 'textarea',
        required: false,
        order_index: 2
      },
      {
        title: 'Would you recommend this to others?',
        type: 'choice',
        required: true,
        options: ['Yes, definitely', 'Yes, probably', 'Not sure', 'Probably not', 'Definitely not'],
        order_index: 3
      }
    ]
  },
  {
    id: 'nps_survey',
    name: 'Net Promoter Score (NPS)',
    description: 'Standard NPS survey to measure customer loyalty and satisfaction',
    category: 'Analytics',
    businessTypes: ['restaurant', 'retail', 'corporate', 'healthcare', 'other'],
    useCases: ['customer_satisfaction', 'market_research'],
    estimatedTime: '30 seconds',
    popular: true,
    tags: ['nps', 'loyalty', 'quick', 'popular'],
    questions: [
      {
        title: 'On a scale of 0-10, how likely are you to recommend us to a friend or colleague?',
        description: '0 = Not at all likely, 10 = Extremely likely',
        type: 'rating',
        required: true,
        rating_scale: 10,
        order_index: 0
      },
      {
        title: 'What is the primary reason for your score?',
        type: 'textarea',
        required: false,
        order_index: 1
      }
    ]
  },
  {
    id: 'customer_service',
    name: 'Customer Service Feedback',
    description: 'Evaluate customer service interactions and support quality',
    category: 'Service',
    businessTypes: ['retail', 'corporate', 'healthcare', 'other'],
    useCases: ['customer_satisfaction'],
    estimatedTime: '2 minutes',
    tags: ['service', 'support', 'staff'],
    questions: [
      {
        title: 'How would you rate the service you received today?',
        type: 'rating',
        required: true,
        rating_scale: 10,
        order_index: 0
      },
      {
        title: 'How knowledgeable was our staff member?',
        type: 'rating',
        required: true,
        rating_scale: 10,
        order_index: 1
      },
      {
        title: 'How quickly was your issue resolved?',
        type: 'choice',
        required: true,
        options: ['Immediately', 'Within a few minutes', 'Within 30 minutes', 'Took longer than expected', 'Not resolved'],
        order_index: 2
      },
      {
        title: 'How friendly and professional was our staff?',
        type: 'rating',
        required: true,
        rating_scale: 10,
        order_index: 3
      },
      {
        title: 'Did we meet your expectations today?',
        type: 'choice',
        required: true,
        options: ['Exceeded expectations', 'Met expectations', 'Below expectations'],
        order_index: 4
      },
      {
        title: 'Additional comments or suggestions',
        type: 'textarea',
        required: false,
        order_index: 5
      }
    ]
  }
]

/**
 * Get templates filtered by business type and use case
 */
export function getTemplatesForProfile(businessType?: string, useCase?: string): FormTemplate[] {
  return FORM_TEMPLATES.filter(template => {
    const matchesBusinessType = !businessType || template.businessTypes.includes(businessType)
    const matchesUseCase = !useCase || template.useCases.includes(useCase)
    return matchesBusinessType && matchesUseCase
  })
}

/**
 * Get popular templates
 */
export function getPopularTemplates(): FormTemplate[] {
  return FORM_TEMPLATES.filter(template => template.popular)
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): FormTemplate | undefined {
  return FORM_TEMPLATES.find(template => template.id === id)
}

/**
 * Get all unique categories
 */
export function getTemplateCategories(): string[] {
  return [...new Set(FORM_TEMPLATES.map(template => template.category))]
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): FormTemplate[] {
  return FORM_TEMPLATES.filter(template => template.category === category)
}
