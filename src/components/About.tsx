import { motion } from 'motion/react';
import { Users, Mail, Github, Linkedin, Award, Zap, Target, Shield } from 'lucide-react';

export default function About() {
  const founders = [
    {
      name: "ANUBHAV AKHIL",
      role: "Co-Founder & Lead Architect",
      bio: "Passionate about building AI systems that empower students to achieve their full potential.",
      initials: "AA",
      color: "from-indigo-500 to-purple-500"
    },
    {
      name: "RAVI RAJ",
      role: "Co-Founder & Product Designer",
      bio: "Dedicated to creating intuitive and beautiful educational experiences for the modern learner.",
      initials: "RR",
      color: "from-pink-500 to-rose-500"
    }
  ];

  const features = [
    { icon: Award, title: "Smart Evaluation", desc: "AI-driven scoring for subjective answers." },
    { icon: Zap, title: "Instant Feedback", desc: "Get detailed insights on your performance immediately." },
    { icon: Target, title: "Personalized Quizzes", desc: "Quizzes tailored to your specific learning goals." },
    { icon: Shield, title: "Secure & Private", desc: "Your study data is safe with our robust security." }
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
          About <span className="text-indigo-600">ExamPrep</span>
        </h1>
        <p className="text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
          We are on a mission to revolutionize how students prepare for exams by leveraging the power of Generative AI to provide personalized, high-quality learning tools.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8 mb-20">
        {founders.map((founder, index) => (
          <motion.div
            key={founder.name}
            initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.2 }}
            className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 hover:shadow-2xl transition-all group"
          >
            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${founder.color} flex items-center justify-center text-white text-3xl font-bold mb-6 group-hover:scale-110 transition-transform`}>
              {founder.initials}
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">{founder.name}</h3>
            <p className="text-indigo-600 font-semibold mb-4">{founder.role}</p>
            <p className="text-slate-600 mb-6 leading-relaxed">{founder.bio}</p>
            <div className="flex gap-4">
              <button className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors">
                <Github className="w-5 h-5" />
              </button>
              <button className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors">
                <Linkedin className="w-5 h-5" />
              </button>
              <button className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors">
                <Mail className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            className="text-center p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100"
          >
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <feature.icon className="w-6 h-6 text-indigo-600" />
            </div>
            <h4 className="font-bold text-slate-900 mb-1">{feature.title}</h4>
            <p className="text-xs text-slate-500">{feature.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
