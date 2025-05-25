import Agent from "@/components/Agent";

const Page = () => {
  // For hackathon - use default user data since we removed authentication
  const defaultUser = {
    name: "Hackathon User",
    id: "hackathon-user"
  };

  return (
    <div className="root-layout">
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Generate Interview Questions</h1>
          <p className="text-lg text-gray-600 mt-2">
            Talk with our AI to create custom interview questions for your preparation
          </p>
        </div>
        
        <Agent 
          userName={defaultUser.name}
          userId={defaultUser.id}
          type="generate"
          profileImage={undefined}
        />
      </div>
    </div>
  );
};

export default Page;
