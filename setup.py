from setuptools import setup, find_packages

# Read requirements
install_requires = []
try:
    with open("requirements.txt") as f:
        install_requires = f.read().strip().split("\n")
except FileNotFoundError:
    install_requires = ["frappe"]

setup(
    name="restaurant_hotel_management",
    version="1.0.0",
    description="Comprehensive Restaurant and Hotel Management System for ERPNext",
    author="Your Company",
    author_email="support@yourcompany.com",
    packages=find_packages(),
    zip_safe=False,
    include_package_data=True,
    install_requires=install_requires,
    python_requires=">=3.8",
    classifiers=[
        "Development Status :: 4 - Beta",
        "Environment :: Web Environment",
        "Framework :: Frappe",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Topic :: Internet :: WWW/HTTP",
        "Topic :: Software Development :: Libraries :: Application Frameworks",
    ],
)