import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const CCLRequestForm = ({ onSubmit, onClose, employee }) => {
  const [formData, setFormData] = useState({
    date: '',
    periods: [],
    reason: ''
  });
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch faculty list
  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/employee/faculty-list/${employee.campus}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch faculty list');
        const data = await response.json();
        setFacultyList(data.filter(f => 
          f.campus === employee.campus && 
          f.department === employee.department &&
          f._id !== employee._id
        ));
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to fetch faculty list');
      }
    };
    fetchFaculty();
  }, [employee]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePeriodChange = (index, field, value) => {
    const updatedPeriods = [...formData.periods];
    updatedPeriods[index] = {
      ...updatedPeriods[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      periods: updatedPeriods
    }));
  };

  const addPeriod = () => {
    if (formData.periods.length >= 4) {
      toast.warning('Maximum 4 periods allowed');
      return;
    }
    setFormData(prev => ({
      ...prev,
      periods: [...prev.periods, { periodNumber: '', class: '', subject: '', originalFaculty: '' }]
    }));
  };

  const removePeriod = (index) => {
    setFormData(prev => ({
      ...prev,
      periods: prev.periods.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate form
    if (!formData.date) {
      setError('Please select a date');
      return;
    }

    if (formData.periods.length === 0) {
      setError('Please add at least one period');
      return;
    }

    if (!formData.reason) {
      setError('Please provide a reason');
      return;
    }

    // Validate periods
    for (const period of formData.periods) {
      if (!period.periodNumber || !period.class || !period.subject || !period.originalFaculty) {
        setError('Please fill in all period details');
        return;
      }
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/employee/ccl-work`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      toast.success('CCL work request submitted successfully');
      onSubmit(response.data.cclWork);
    } catch (error) {
      console.error('Error submitting CCL work request:', error);
      setError(error.response?.data?.msg || 'Failed to submit CCL work request');
      toast.error(error.response?.data?.msg || 'Failed to submit CCL work request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Submit CCL Work</h2>
            <p className="text-sm text-gray-500 mt-1">
              Fill in the details of the work you performed
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Work <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Periods */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Periods <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={addPeriod}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add Period
              </button>
            </div>

            {formData.periods.map((period, index) => (
              <div key={index} className="mb-4 p-4 border rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Period {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removePeriod(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Period Number</label>
                    <select
                      value={period.periodNumber}
                      onChange={(e) => handlePeriodChange(index, 'periodNumber', e.target.value)}
                      className="w-full p-2 border rounded-md"
                      required
                    >
                      <option value="">Select Period</option>
                      {[1, 2, 3, 4, 5, 6, 7].map(num => (
                        <option key={num} value={num}>Period {num}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Class</label>
                    <input
                      type="text"
                      value={period.class}
                      onChange={(e) => handlePeriodChange(index, 'class', e.target.value)}
                      className="w-full p-2 border rounded-md"
                      placeholder="e.g., CSE-A"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Subject</label>
                    <input
                      type="text"
                      value={period.subject}
                      onChange={(e) => handlePeriodChange(index, 'subject', e.target.value)}
                      className="w-full p-2 border rounded-md"
                      placeholder="e.g., Data Structures"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Original Faculty</label>
                    <select
                      value={period.originalFaculty}
                      onChange={(e) => handlePeriodChange(index, 'originalFaculty', e.target.value)}
                      className="w-full p-2 border rounded-md"
                      required
                    >
                      <option value="">Select Faculty</option>
                      {facultyList.map(faculty => (
                        <option key={faculty._id} value={faculty._id}>
                          {faculty.name} ({faculty.employeeId})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              rows="3"
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Explain why you worked on this day"
              required
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CCLRequestForm; 