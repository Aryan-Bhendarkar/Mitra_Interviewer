import { redirect } from "next/navigation";
import Agent from "@/components/Agent";
import { getCurrentUser } from "@/lib/actions/auth.action";

const Page = async () => {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

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
          userName={user.name}
          userId={user.id}
          type="generate"
          profileImage={user.profileURL}
        />
      </div>
    </div>
  );
};

export default Page;
