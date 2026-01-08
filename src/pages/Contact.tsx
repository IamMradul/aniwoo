import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const contactSchema = z.object({
  name: z.string().min(2, 'Please enter your full name.'),
  email: z.string().email('Please enter a valid email address.'),
  topic: z.string().min(1, 'Please select a topic.'),
  message: z.string().min(10, 'Please provide at least 10 characters.')
});

type ContactFormValues = z.infer<typeof contactSchema>;
 
const Contact = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
    reset
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      topic: '',
      message: ''
    }
  });

  const onSubmit = async (values: ContactFormValues) => {
    // TODO: Send to backend contact endpoint or CRM integration
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 800));
    // eslint-disable-next-line no-console
    console.log('Contact form submitted', values);
    reset();
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-10 md:grid-cols-[1.1fr,1fr]">
        <div>
          <h1 className="font-display text-2xl font-semibold text-dark sm:text-3xl">Contact Aniwoo</h1>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            Questions about vet services, grooming, or our AI health scanner? We&apos;d love to hear from you.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Name
              </label>
              <input
                id="name"
                type="text"
                {...register('name')}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
                placeholder="Your full name"
                aria-invalid={errors.name ? 'true' : 'false'}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600" role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Email
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
                placeholder="you@example.com"
                aria-invalid={errors.email ? 'true' : 'false'}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="topic" className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Topic
              </label>
              <select
                id="topic"
                {...register('topic')}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
                aria-invalid={errors.topic ? 'true' : 'false'}
              >
                <option value="">Select a topic</option>
                <option value="general">General question</option>
                <option value="ai-health-check">AI Health Check</option>
                <option value="vets">Vet Services</option>
                <option value="shop">Shop &amp; Products</option>
                <option value="mating-connect">Mating Connect</option>
                <option value="other">Other</option>
              </select>
              {errors.topic && (
                <p className="mt-1 text-xs text-red-600" role="alert">
                  {errors.topic.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="message" className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Message
              </label>
              <textarea
                id="message"
                rows={4}
                {...register('message')}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
                placeholder="Tell us how we can help you and your pet."
                aria-invalid={errors.message ? 'true' : 'false'}
              />
              {errors.message && (
                <p className="mt-1 text-xs text-red-600" role="alert">
                  {errors.message.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-full bg-primary px-7 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>

            {isSubmitSuccessful && (
              <p className="text-xs text-emerald-600">
                Thank you! Your message has been sent. Our team will get back to you soon.
              </p>
            )}
          </form>
        </div>

        <aside aria-label="Aniwoo contact details" className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-sm font-semibold text-dark">Other ways to reach us</h2>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>Email: support@aniwoo.pet</li>
            <li>Phone: +1 (555) 987-1234</li>
            <li>Address: 123 Pet Lane, Paw City</li>
          </ul>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Support hours</p>
            <p className="mt-1 text-xs text-slate-600">
              Monday–Friday: 9:00 AM – 6:00 PM (Local time) • Response within 1–2 business days.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Coming soon</p>
            <p className="mt-1 text-xs text-slate-600">
              Live chat, in-app messaging, and dedicated breeder support will be available in future Aniwoo releases.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
};

export default Contact;


