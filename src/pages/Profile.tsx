import { useState } from 'react';

function Profile() {
  const [isEditing, setIsEditing] = useState(false);

  const user = {
    name: 'Eugene onyango Juma',
    email: 'onyangoeugene@gmail.com',
    university: 'usiu',
    avatar: 'E',
  };

  return (
    <section className="profile-page">
      <div className="container">
        <h1>My Profile</h1>

        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">{user.avatar}</div>
            <div className="profile-info">
              <h2>{user.name}</h2>
              <div className="profile-details">
                <span className="profile-email">{user.email}</span>
                <span className="profile-university">{user.university}</span>
              </div>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="button button-secondary"
              >
                Edit
              </button>
            )}
          </div>

          {isEditing && (
            <div className="profile-edit-form">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  defaultValue={user.name}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  defaultValue={user.email}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>University</label>
                <input
                  type="text"
                  defaultValue={user.university}
                  className="form-input"
                />
              </div>
              <div className="form-actions">
                <button
                  onClick={() => setIsEditing(false)}
                  className="button button-primary"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="button button-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default Profile;
