import React, { useContext } from "react";
import { useSelector } from "react-redux";
import { AuthContext } from "../../App";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";

const Header = ({ onMenuClick }) => {
  const { logout } = useContext(AuthContext);
  const user = useSelector((state) => state.user?.user);

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center py-4">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden mr-3"
          >
            <ApperIcon name="Menu" size={20} />
          </Button>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-lg">
              <ApperIcon name="Hotel" size={18} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 hidden sm:block">
              StayFlow
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700"
          >
            <ApperIcon name="Bell" size={18} />
          </Button>
          <Button 
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700"
          >
            <ApperIcon name="Settings" size={18} />
          </Button>
          {user && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-700 hidden sm:block">
                {user.firstName} {user.lastName}
              </span>
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <ApperIcon name="User" size={16} className="text-primary-600" />
              </div>
            </div>
          )}
          <Button 
            variant="outline"
            size="sm"
            onClick={logout}
            className="text-gray-700"
          >
            <ApperIcon name="LogOut" size={16} className="mr-1" />
            Logout
          </Button>
        </div>
      </div>
    </header>
);
};

export default Header;