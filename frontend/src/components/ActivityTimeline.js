import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import {
  FiLogIn, FiUserPlus, FiDollarSign, FiTrendingUp,
  FiTrash2, FiDownload, FiActivity
} from 'react-icons/fi';
import './ActivityTimeline.css';

function ActivityTimeline() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/activity?limit=50');
      setActivities(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setLoading(false);
    }
  };

  const getActivityIcon = (action) => {
    switch (action) {
      case 'LOGIN':
        return <FiLogIn />;
      case 'REGISTER':
        return <FiUserPlus />;
      case 'ADD_EXPENSE':
        return <FiDollarSign />;
      case 'ADD_REVENUE':
        return <FiTrendingUp />;
      case 'RUN_SIMULATION':
        return <FiActivity />;
      case 'DELETE_TRANSACTION':
        return <FiTrash2 />;
      case 'EXPORT_DATA':
        return <FiDownload />;
      default:
        return <FiActivity />;
    }
  };

  const getActivityColor = (action) => {
    switch (action) {
      case 'LOGIN':
      case 'REGISTER':
        return 'activity-blue';
      case 'ADD_EXPENSE':
      case 'DELETE_TRANSACTION':
        return 'activity-red';
      case 'ADD_REVENUE':
        return 'activity-green';
      case 'RUN_SIMULATION':
      case 'EXPORT_DATA':
        return 'activity-purple';
      default:
        return 'activity-blue';
    }
  };

  const getActivityTitle = (action) => {
    const titles = {
      'LOGIN': 'Logged In',
      'REGISTER': 'Account Created',
      'ADD_EXPENSE': 'Added Expense',
      'ADD_REVENUE': 'Added Revenue',
      'RUN_SIMULATION': 'Ran Simulation',
      'DELETE_TRANSACTION': 'Deleted Transaction',
      'EXPORT_DATA': 'Exported Data',
      'UPDATE_CASH': 'Updated Cash Balance'
    };
    return titles[action] || action;
  };

  const getActivityDetails = (activity) => {
    if (!activity.details) return null;

    try {
      const details = JSON.parse(activity.details);

      if (activity.action === 'ADD_EXPENSE' || activity.action === 'ADD_REVENUE') {
        return `${details.description} - ₹${Math.abs(details.amount).toLocaleString('en-IN')}`;
      }

      if (activity.action === 'RUN_SIMULATION') {
        return `Simulated ${details.new_hires} new hires at ₹${details.avg_salary.toLocaleString('en-IN')}/month`;
      }

      if (activity.action === 'DELETE_TRANSACTION') {
        return `${details.description} - ₹${Math.abs(details.amount).toLocaleString('en-IN')}`;
      }

      return null;
    } catch (e) {
      return activity.details;
    }
  };

  return (
    <div className="activity-timeline-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Activity Timeline</h1>
          <p className="page-subtitle">Track all your account activities</p>
        </div>
      </div>

      <div className="timeline-container">
        {loading ? (
          <div className="loading-state">Loading activities...</div>
        ) : activities.length === 0 ? (
          <div className="empty-state">
            <p>No activities yet</p>
          </div>
        ) : (
          <div className="timeline">
            {activities.map((activity, index) => (
              <div key={activity.id} className="timeline-item">
                <div className={`timeline-icon ${getActivityColor(activity.action)}`}>
                  {getActivityIcon(activity.action)}
                </div>
                <div className="timeline-content">
                  <div className="timeline-header">
                    <h3 className="timeline-title">{getActivityTitle(activity.action)}</h3>
                    <span className="timeline-time">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                  {getActivityDetails(activity) && (
                    <p className="timeline-details">{getActivityDetails(activity)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ActivityTimeline;
