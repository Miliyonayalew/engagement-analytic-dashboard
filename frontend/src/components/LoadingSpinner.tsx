interface LoadingSpinnerProps {
  message?: string
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = "Loading..." }) => {
  return (
    <div className="loading-spinner">
      <div className="spinner"></div>
    </div>
  )
}

export default LoadingSpinner 