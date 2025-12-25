

import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';


import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, User, MessageCircle, Puzzle, Store, ArrowRight, Shield, ThumbsUp } from 'lucide-react';
import { hexToHslString } from '../utils/colors';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const FeatureCard = ({ icon, title, description }) => (
  <Card className="h-full text-center bg-card/50 border-secondary hover:border-primary transition-all duration-300">
    <CardContent className="flex flex-col items-center p-6">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        {React.cloneElement(icon, { className: "h-8 w-8 text-primary" })}
      </div>
      <h3 className="mb-2 text-xl font-bold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

const MockProfileCard = () => {
    const { settings } = useSettings();
    const primaryColor = settings?.accent_color || '#FF4D00';
    const primaryHsl = hexToHslString(primaryColor);

    return (
        <Card
            className="relative w-full max-w-sm mx-auto bg-card/80 backdrop-blur-sm shadow-2xl shadow-primary/10 overflow-hidden p-[2px]"
            style={{ '--primary-shadow-color': primaryHsl ? `hsl(${primaryHsl})` : primaryColor }}
        >
            <span
                className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite]"
                style={{ background: `conic-gradient(from 90deg at 50% 50%, white 0%, var(--primary-shadow-color) 50%, white 100%)`}}
            />
            <div className="relative z-10 bg-card rounded-[10px]">
                <div className="relative">
                    <div className="p-4 pb-0">
                         <div
                            className="w-full aspect-[16/5] rounded-lg bg-cover bg-center bg-secondary"
                            style={{ backgroundImage: `url('/placeholders/banner_placeholder_home.png')` }}
                        />
                    </div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-[25%] max-w-[80px] min-w-[64px] aspect-square">
                        <Avatar className="h-full w-full border-4 border-background">
                            <AvatarImage src="/placeholders/avatar_placeholder.png" />
                            <AvatarFallback><User className="h-[60%] w-[60%]" /></AvatarFallback>
                        </Avatar>
                    </div>
                </div>
                <div className="flex flex-col items-center text-center px-4 pb-4 pt-12">
                     <h2 className="font-sans mt-0 flex items-center gap-2 text-2xl font-bold">FlameWall</h2>
                     <p className="mt-2 text-sm text-muted-foreground">Your cool description goes here!</p>
                     <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm">
                       <div className="flex items-center gap-2"><ThumbsUp className="h-4 w-4 text-primary" /> 1234</div>
                       <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> FlameWall</div>
                     </div>
                </div>
            </div>
        </Card>
    );
};


function LandingPage() {
  return (
    <div className="px-4 md:px-6">

      {}
      <motion.section
        initial="initial"
        animate="animate"
        variants={staggerContainer}
        className="relative flex min-h-[80vh] flex-col items-center justify-center py-12 text-center overflow-hidden"
      >
        <div className="absolute inset-0 -z-10 bg-grid-white/[0.05] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>

        <motion.div variants={fadeInUp}>
          <Badge variant="outline" className="py-1 px-3 border-primary/50 text-primary">Your Server, Your Community</Badge>
        </motion.div>
        <motion.h1
          variants={fadeInUp}
          className="mt-4 bg-gradient-to-br from-neutral-50 to-neutral-400 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl md:text-7xl"
        >
          Your Gaming Community,
          <br />
          <span className="bg-primary-hue-0 bg-clip-text text-transparent">Reimagined.</span>
        </motion.h1>
        <motion.p
          variants={fadeInUp}
          className="mx-auto mt-6 max-w-[700px] text-lg text-muted-foreground md:text-xl"
        >
          A modern web platform that bridges the gap between your players and your server. Profiles, clans, integrated chat, and a web store that just works.
        </motion.p>
        <motion.div
          variants={fadeInUp}
          className="mt-8 flex flex-wrap justify-center gap-4"
        >
          <Button asChild size="lg" className="text-base font-semibold shadow-lg shadow-primary/20">
            <RouterLink to="/register">
              Join Now <ArrowRight className="ml-2 h-5 w-5" />
            </RouterLink>
          </Button>
          <Button asChild size="lg" variant="outline" className="text-base font-semibold">
            <RouterLink to="/posts">
              Explore Community
            </RouterLink>
          </Button>
        </motion.div>
      </motion.section>

      {}
      <motion.section
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerContainer}
        className="py-12 md:py-24"
      >
        <div className="container mx-auto">
          <motion.h2 variants={fadeInUp} className="mb-12 text-center text-3xl font-bold md:text-4xl">
            Everything in One Place
          </motion.h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <motion.div variants={fadeInUp}><FeatureCard icon={<Users />} title="Player Profiles" description="Showcase stats, achievements, and manage your friends list and private messages." /></motion.div>
            <motion.div variants={fadeInUp}><FeatureCard icon={<Puzzle />} title="Server Integration" description="Live online status, in-game chat bridge, and seamless rank synchronization." /></motion.div>
            <motion.div variants={fadeInUp}><FeatureCard icon={<Shield />} title="Clans & Community" description="Create or join clans, manage roles with granular permissions, and communicate in dedicated clan chats." /></motion.div>
            <motion.div variants={fadeInUp}><FeatureCard icon={<Store />} title="Web Store" description="Support the server by purchasing ranks and items that are delivered in-game instantly." /></motion.div>
          </div>
        </div>
      </motion.section>

      {}
      <motion.section
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.3 }}
        variants={fadeInUp}
        className="py-12 md:py-24"
      >
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Show Off Your Style</h2>
          <p className="mx-auto mt-4 max-w-[600px] text-muted-foreground">
            Every player gets a beautiful, customizable profile page to share their identity and achievements with the community.
          </p>
          <div className="mt-12">
            <MockProfileCard />
          </div>
        </div>
      </motion.section>

      {}
      <motion.section
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.5 }}
        variants={fadeInUp}
        className="my-12 md:my-24"
      >
        <div className="container mx-auto rounded-lg bg-card p-8 text-center border border-primary/20">
          <h2 className="text-3xl font-bold">Ready to Dive In?</h2>
          <p className="mt-2 mb-6 text-muted-foreground">
            Create your account in seconds and become part of the community.
          </p>
          <Button asChild size="lg" className="text-base font-semibold">
            <RouterLink to="/register">Sign Up for Free</RouterLink>
          </Button>
        </div>
      </motion.section>

      {}
      <motion.footer
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.8 }}
        variants={fadeInUp}
        className="pt-8 text-center text-sm text-muted-foreground"
      >
        <p>© {new Date().getFullYear()} FlameWall. All rights reserved.</p>
        <p>
          Powered by{' '}
          <a href="https://flamewall.xyz" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
            FlameWall
          </a>
        </p>
      </motion.footer>

    </div>
  );
}

export default LandingPage;
