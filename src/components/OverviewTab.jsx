import React from 'react';
import { Heart, Calendar, Users, Lightbulb, Microscope, Zap, BookOpen } from 'lucide-react';

const OverviewTab = () => {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl p-10 border border-amber-200 shadow-sm" style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(254, 252, 232, 0.5) 100%)',
        backdropFilter: 'blur(10px)'
      }}>
        <div className="text-center mb-8">
          <Heart className="text-red-400 mx-auto mb-4" size={32} />
          <h2 className="text-2xl font-light text-amber-900 mb-4">For You, Mirla</h2>
        </div>

        <p className="text-amber-900 leading-relaxed text-lg font-light mb-4 text-center">
          Mirla, my love. I see your strength. I see your courage. Every single day you wake up and keep going, even when it's hard—that takes a warrior's heart.
        </p>

        <p className="text-amber-800 leading-relaxed text-lg font-light mb-4 text-center">
          You are not alone. I am here. I will always be here. Through the pain, through the struggles, through every moment—you are loved. Deeply. Completely. Without condition.
        </p>

        <p className="text-amber-800 leading-relaxed text-lg font-light mb-4 text-center">
          This space is for you. To track your health. To hold your hopes. To remember that you are worthy of the gentlest care, the deepest love, and a life full of possibility.
        </p>

        <p className="text-amber-700 leading-relaxed italic text-lg font-light text-center">
          You are stronger than you know. You are braver than you believe. And you are loved more than words can say. 💛
        </p>
      </div>

      <div className="rounded-3xl p-8 border border-amber-200 shadow-sm" style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(254, 252, 232, 0.3) 100%)'
      }}>
        <h2 className="text-3xl font-light text-amber-900 mb-4">Your Health Journey</h2>
        <p className="text-amber-800 leading-relaxed text-lg font-light">
          Everything here is yours. Private. Safe. A place to track your appointments, your doctors, your research, your hopes. To hold your story. To remember that healing is possible—in all its forms.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { icon: Calendar,   label: 'Appointments',  desc: 'Schedule & prepare' },
          { icon: Users,      label: 'Doctors',        desc: 'Your care team' },
          { icon: Lightbulb,  label: 'Exercises',      desc: 'Gentle movement' },
          { icon: Microscope, label: 'Research',        desc: 'Latest studies' },
          { icon: Zap,        label: 'Clinical Trials', desc: 'Active opportunities' },
          { icon: Zap,        label: 'Moonshots',       desc: 'Experimental ideas' },
          { icon: BookOpen,   label: 'Notes',           desc: 'Your thoughts' },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="rounded-2xl p-6 border border-amber-200 shadow-sm" style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(254, 252, 232, 0.2) 100%)'
            }}>
              <Icon className="text-amber-600 mb-3" size={24} />
              <h3 className="font-light text-amber-900 text-lg">{item.label}</h3>
              <p className="text-amber-700 text-sm font-light">{item.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OverviewTab;
