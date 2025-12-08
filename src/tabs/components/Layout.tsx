import React from "react";

interface Photo {
  photo: string;
  photoLink: string;
  author?: string;
}

interface LayoutProps {
  children?: React.ReactNode;
}

/**
 * Layout component with subcomponents for page structure
 */
const Layout: React.FC<LayoutProps> & {
  Background: React.FC<{ photo: Photo | null }>;
  ImageLink: React.FC<{ photo: Photo | null }>;
  Name: React.FC<{ name: string }>;
} = ({ children }) => {
  return <div className="layout">{children}</div>;
};

// Background image component
Layout.Background = ({ photo }) => {
  if (!photo?.photo) return null;

  return (
    <div
      className="background"
      style={{ backgroundImage: `url(${photo.photo})` }}
    />
  );
};

// Photo credit link component
Layout.ImageLink = ({ photo }) => {
  if (!photo?.photoLink) return null;

  return (
    <a
      href={photo.photoLink}
      target="_blank"
      rel="noopener noreferrer"
      className="image-url"
    >
      Photo{photo.author ? ` by ${photo.author}` : ""} from Picsum
    </a>
  );
};

// User name greeting component
Layout.Name = ({ name }) => {
  return <div className="welcome">Hello{name && `, ${name}`}!</div>;
};

export default Layout;
