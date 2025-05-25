"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { mappings } from "@/constants";

interface InterviewFormData {
  role: string;
  level: string;
  type: string;
  techstack: string[];
  amount: number;
}

interface InterviewGenerationFormProps {
  userId: string;
}

const InterviewGenerationForm = ({ userId }: InterviewGenerationFormProps) => {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState<InterviewFormData>({
    role: "",
    level: "Junior",
    type: "Technical",
    techstack: [],
    amount: 5,
  });

  const handleTechStackChange = (tech: string) => {
    setFormData(prev => ({
      ...prev,
      techstack: prev.techstack.includes(tech)
        ? prev.techstack.filter(t => t !== tech)
        : [...prev.techstack, tech]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.role.trim()) {
      alert("Please enter a job role");
      return;
    }

    if (formData.techstack.length === 0) {
      alert("Please select at least one technology");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userId
        })
      });

      const result = await response.json();

      if (result.success && result.interviewId) {
        // Redirect to the dashboard to see the new interview card
        router.push('/');
      } else {
        alert("Failed to generate interview. Please try again.");
      }
    } catch (error) {
      console.error("Error generating interview:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const techOptions = Object.keys(mappings);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Create New Interview</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Job Role */}
        <div>
          <label className="block text-sm font-medium mb-2">Job Role</label>
          <input
            type="text"
            value={formData.role}
            onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
            placeholder="e.g., Frontend Developer, Full Stack Engineer"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Experience Level */}
        <div>
          <label className="block text-sm font-medium mb-2">Experience Level</label>
          <select
            value={formData.level}
            onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Junior">Junior</option>
            <option value="Mid-level">Mid-level</option>
            <option value="Senior">Senior</option>
            <option value="Lead">Lead</option>
          </select>
        </div>

        {/* Interview Type */}
        <div>
          <label className="block text-sm font-medium mb-2">Interview Focus</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Technical">Technical</option>
            <option value="Behavioral">Behavioral</option>
            <option value="Mixed">Mixed</option>
          </select>
        </div>

        {/* Number of Questions */}
        <div>
          <label className="block text-sm font-medium mb-2">Number of Questions</label>
          <select
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: parseInt(e.target.value) }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={3}>3 Questions</option>
            <option value={5}>5 Questions</option>
            <option value={7}>7 Questions</option>
            <option value={10}>10 Questions</option>
          </select>
        </div>

        {/* Tech Stack */}
        <div>
          <label className="block text-sm font-medium mb-2">Technology Stack</label>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-3 border border-gray-300 rounded-lg">
            {techOptions.map((tech) => (
              <label key={tech} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.techstack.includes(tech)}
                  onChange={() => handleTechStackChange(tech)}
                  className="rounded text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm capitalize">{tech}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Selected: {formData.techstack.length} technologies
          </p>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isGenerating}
          className="w-full btn-primary"
        >
          {isGenerating ? "Generating Interview..." : "Create Interview"}
        </Button>
      </form>
    </div>
  );
};

export default InterviewGenerationForm;
