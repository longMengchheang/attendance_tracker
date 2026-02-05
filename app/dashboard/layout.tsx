import Sidebar from '../components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Mock role check - in a real app, this would come from your AuthContext or session
  const userRole = 'teacher'; // Replace with actual auth logic
  
  if (userRole !== 'teacher') {
      return (
          <div className="flex items-center justify-center h-screen bg-gray-100">
              <div className="text-center">
                  <h1 className="text-2xl font-bold text-red-500">Access Denied</h1>
                  <p className="text-gray-600">This dashboard is for teachers only.</p>
              </div>
          </div>
      )
  }

  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      <Sidebar />
      <div className="flex-1 ml-60 flex flex-col">
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
