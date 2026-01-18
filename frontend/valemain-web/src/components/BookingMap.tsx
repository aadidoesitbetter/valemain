"use client";

import { motion } from "framer-motion";
import { Locate, MapPin, Navigation } from "lucide-react";

export default function BookingMap() {
    return (
        <div className="relative w-full h-full bg-neutral-900 overflow-hidden rounded-3xl border border-neutral-800 shadow-2xl">
            {/* Fake Map Grid */}
            <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: "radial-gradient(#4b5563 1px, transparent 1px)", backgroundSize: "40px 40px" }}>
            </div>

            {/* Radar Sweep Animation */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent rounded-full"
                style={{ width: '200%', height: '200%', top: '-50%', left: '-50%' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />

            {/* Floating Elements (Mock POV) */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                    <div className="h-4 w-4 bg-emerald-500 rounded-full animate-ping absolute inset-0 m-auto"></div>
                    <Navigation className="h-8 w-8 text-emerald-400 fill-emerald-400/20 rotate-45 transform" />
                </div>
            </div>

            {/* UI Overlay */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                <div className="bg-neutral-950/80 backdrop-blur-md p-3 rounded-xl border border-neutral-800">
                    <p className="text-xs text-neutral-400 uppercase tracking-widest">Destination</p>
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-emerald-400" />
                        Connaught Place, Delhi
                    </h3>
                    <p className="text-emerald-400 text-xs mt-1">ETA: 4 mins</p>
                </div>

                <div className="bg-neutral-950/80 backdrop-blur-md p-2 rounded-full border border-neutral-800">
                    <Locate className="h-5 w-5 text-neutral-400" />
                </div>
            </div>

        </div>
    );
}
