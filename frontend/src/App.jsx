import { useState, useEffect } from 'react';
import {
  SignedIn,
  SignedOut,
  SignIn,
  UserButton,
  OrganizationSwitcher,
  useAuth,
} from '@clerk/clerk-react';
import { logger } from './logger';

function App() {
  const { isLoaded, isSignedIn, getToken, orgId } = useAuth();

  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    deviceName: '',
    deviceType: 'laptop',
    serialNumber: '',
    ipAddress: '',
    location: '',
    assignedTo: '',
  });

  const API_URL = 'http://localhost:3000/api/devices';

  // Log auth state changes to the unified log
  useEffect(() => {
    if (isLoaded) {
      logger.info('Auth state changed', {
        isSignedIn: !!isSignedIn,
        orgId: orgId || null,
      });
    }
  }, [isLoaded, isSignedIn, orgId]);

  // Re-fetch whenever the user logs in OR switches organization
  useEffect(() => {
    if (isSignedIn && orgId) {
      fetchDevices();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, orgId]);

  const authFetch = async (url, options = {}) => {
    const token = await getToken();
    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  };

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const response = await authFetch(API_URL);
      const data = await response.json();
      if (data.success) {
        setDevices(data.data);
        logger.info('Devices fetched', { count: data.data.length });
      } else {
        logger.error('Failed to fetch devices', {
          status: response.status,
          error: data.error,
        });
      }
    } catch (error) {
      logger.error('Error fetching devices', { error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await authFetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (data.success) {
        logger.info('Device added', {
          deviceName: formData.deviceName,
          deviceType: formData.deviceType,
        });
        setFormData({
          deviceName: '',
          deviceType: 'laptop',
          serialNumber: '',
          ipAddress: '',
          location: '',
          assignedTo: '',
        });
        fetchDevices();
      } else {
        logger.error('Failed to add device (server rejected)', {
          status: response.status,
          error: data.error,
          formData,
        });
        alert('Error: ' + data.error);
      }
    } catch (error) {
      logger.error('Failed to add device (network)', {
        error: error.message,
        formData,
      });
      alert('Failed to add device');
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  return (
    <>
      <SignedOut>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <SignIn routing="hash" afterSignInUrl="/" />
        </div>
      </SignedOut>

      <SignedIn>
        <div className="min-h-screen p-8 max-w-6xl mx-auto">
          <header className="mb-8 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-blue-700">🖥️ IT Inventory Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Manage your organization's hardware and network devices.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <OrganizationSwitcher
                hidePersonal={true}
                afterCreateOrganizationUrl="/"
                afterSelectOrganizationUrl="/"
              />
              <UserButton afterSignOutUrl="/" />
            </div>
          </header>

          {!orgId ? (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-6 rounded-xl">
              <h2 className="font-semibold text-lg mb-2">No organization selected</h2>
              <p>Please create or select an organization using the switcher in the top-right corner.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Add Device Form */}
              <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-md border border-gray-200 h-fit">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Add New Device</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Device Name</label>
                    <input type="text" name="deviceName" value={formData.deviceName} onChange={handleInputChange} required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border" placeholder="e.g., Dell Latitude 5420" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Device Type</label>
                    <select name="deviceType" value={formData.deviceType} onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border">
                      <option value="laptop">Laptop</option>
                      <option value="desktop">Desktop</option>
                      <option value="server">Server</option>
                      <option value="router">Router</option>
                      <option value="switch">Switch</option>
                      <option value="printer">Printer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Serial Number</label>
                    <input type="text" name="serialNumber" value={formData.serialNumber} onChange={handleInputChange} required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border" placeholder="e.g., SN123456" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">IP Address</label>
                    <input type="text" name="ipAddress" value={formData.ipAddress} onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border" placeholder="e.g., 192.168.1.50" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <input type="text" name="location" value={formData.location} onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border" placeholder="e.g., Office 302" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Assigned To</label>
                    <input type="text" name="assignedTo" value={formData.assignedTo} onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border" placeholder="e.g., John Doe" />
                  </div>

                  <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200">
                    Add Device
                  </button>
                </form>
              </div>

              {/* Device List */}
              <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md border border-gray-200">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                  Registered Devices ({devices.length})
                </h2>

                {loading ? (
                  <p className="text-gray-500">Loading devices...</p>
                ) : devices.length === 0 ? (
                  <p className="text-gray-500">No devices found. Add one using the form!</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial No.</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {devices.map((device) => (
                          <tr key={device._id} className="hover:bg-gray-50 transition">
                            <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">{device.deviceName}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                                {device.deviceType}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-600 font-mono text-sm">{device.serialNumber}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-600 font-mono text-sm">{device.ipAddress || 'N/A'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-600 text-sm">{device.location || 'N/A'}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                device.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {device.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </SignedIn>
    </>
  );
}

export default App;