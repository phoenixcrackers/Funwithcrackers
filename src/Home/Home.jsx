import React, { useState } from 'react';
import { Sparkles, Rocket, Volume2, Bomb, Disc, CloudSun } from 'lucide-react';
import '../App.css';

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(1);

  const nextSlide = () => setCurrentSlide(currentSlide === 3 ? 1 : currentSlide + 1);
  const prevSlide = () => setCurrentSlide(currentSlide === 1 ? 3 : currentSlide - 1);

  const categories = [
    { name: 'Sparklers', icon: Sparkles },
    { name: 'Rockets', icon: Rocket },
    { name: 'Single Sound Crackers', icon: Volume2 },
    { name: 'Atom Bombs', icon: Bomb },
    { name: 'Ground Chakkars', icon: Disc },
    { name: 'Sky Shots', icon: CloudSun },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900">
      {/* Navbar */}
      <nav className="navbar bg-indigo-500 text-white px-8 py-4 shadow-lg sticky top-0 z-50">
        <div className="flex-1 text-2xl font-extrabold tracking-wide">
          Fun With Firecrackers
        </div>
        <div className="flex gap-6 text-lg items-center">
          {['Home', 'About Us', 'Price List', 'Safety Tips', 'Contact Us'].map(
            (link) => (
              <a
                key={link}
                href={`#${link.toLowerCase().replace(/ /g, '-')}`}
                className="link link-hover text-white hover:text-indigo-200"
              >
                {link}
              </a>
            )
          )}
        </div>
      </nav>

      {/* Carousel */}
      <div className="w-full mt-6 px-4">
        <div className="carousel w-full rounded-xl shadow-xl overflow-hidden relative bg-white ring ring-gray-900/5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`carousel-item w-full transition-transform duration-500 ease-in-out transform ${
                currentSlide === i ? 'translate-x-0' : '-translate-x-full hidden'
              }`}
            >
              <img
                src={`/ban${i}.webp`}
                className="w-full object-cover h-[450px]"
                alt={`Banner ${i}`}
              />
            </div>
          ))}
          <div className="absolute flex justify-between transform -translate-y-1/2 left-4 right-4 top-1/2 z-10">
            <button
              onClick={prevSlide}
              className="btn btn-circle bg-indigo-500 text-white hover:bg-indigo-600"
            >
              ❮
            </button>
            <button
              onClick={nextSlide}
              className="btn btn-circle bg-indigo-500 text-white hover:bg-indigo-600"
            >
              ❯
            </button>
          </div>
        </div>
      </div>

      {/* About Section */}
      <section
        id="about"
        className="py-16 px-4 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12"
      >
        <div className="flex justify-center">
          <img
            src="/cont.png"
            alt="Store"
            className="rounded-2xl shadow-2xl w-72 md:w-96 lg:w-[400px]"
          />
        </div>
        <div className="lg:w-1/2 space-y-6 bg-white rounded-lg px-6 py-8 ring shadow-xl ring-gray-900/5">
          <h2 className="text-5xl font-extrabold text-indigo-500">
            Fun With Crackers
          </h2>
          <p className="text-lg leading-relaxed text-gray-500">
            Fun With Crackers has been a well-known Fireworks Store in Sivakasi.
            What started out as a hobby has become our passion.
          </p>
          <p className="text-lg leading-relaxed text-gray-500">
            We offer quality products, unparalleled service, and the most
            competitive prices in town.
          </p>
          <p className="text-lg leading-relaxed text-gray-500">
            Trusted name among top companies in the Sivakasi fireworks business,
            manufacturing, wholesaling, and retailing traditional and modern
            fireworks.
          </p>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="py-16 px-4 max-w-7xl mx-auto">
        <h2 className="text-5xl font-extrabold text-indigo-500 mb-12 text-center">
          Our Categories
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {categories.map(({ name, icon: Icon }, idx) => (
            <div
              key={idx}
              className="card bg-white rounded-lg px-6 py-8 shadow-xl ring ring-gray-900/5 hover:shadow-2xl transition-transform duration-300 hover:-translate-y-1"
            >
              <span className="inline-flex items-center justify-center rounded-md bg-indigo-500 p-2 shadow-lg mx-auto">
                <Icon className="h-6 w-6 stroke-white" />
              </span>
              <h3 className="text-gray-900 mt-5 text-base font-medium tracking-tight text-center">
                {name}
              </h3>
              <p className="text-gray-500 mt-2 text-sm text-center">
                Get quality {name} from Fun With Crackers
              </p>
              <div className="card-actions justify-center mt-4">
                <button className="btn btn-sm bg-indigo-500 text-white hover:bg-indigo-600">
                  Read More
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="footer p-10 bg-indigo-500 text-white mt-auto">
        <aside>
          <h2 className="text-2xl font-bold">Fun With Firecrackers</h2>
          <p className="text-gray-200">
            Bringing joy to your celebrations since 1990
          </p>
        </aside>
        <nav>
          <h6 className="footer-title text-white">Quick Links</h6>
          <a
            href="#about"
            className="link link-hover text-gray-200 hover:text-indigo-200"
          >
            About Us
          </a>
          <a
            href="#categories"
            className="link link-hover text-gray-200 hover:text-indigo-200"
          >
            Categories
          </a>
          <a
            href="#contact"
            className="link link-hover text-gray-200 hover:text-indigo-200"
          >
            Contact Us
          </a>
        </nav>
      </footer>
    </div>
  );
}