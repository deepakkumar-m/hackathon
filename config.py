"""
GBME DevOps Hackathon - Configuration
Update tool URLs and team credentials here before the hackathon.
"""

import os

# Flask
SECRET_KEY = os.environ.get('SECRET_KEY', 'gbme-hackathon-secret-2026')

# ============================================
# EXTERNAL TOOL URLs
# Update these to your actual tool URLs
# ============================================
TOOL_URLS = {
    'bitbucket': 'https://bitbucket.example.com/projects/GBME',
    'jenkins': 'https://jenkins.example.com',
    'argocd': 'https://argocd.example.com',
    'rancher': 'https://rancher.example.com',
    'jfrog': 'https://jfrog.example.com',
    'grafana': 'https://grafana.example.com',
}

# ============================================
# TEAM CREDENTIALS
# Pre-configured for 10 teams
# ============================================
TEAMS = {
    'team1':  {'password': 'team1pass',  'display_name': 'Team 1'},
    'team2':  {'password': 'team2pass',  'display_name': 'Team 2'},
    'team3':  {'password': 'team3pass',  'display_name': 'Team 3'},
    'team4':  {'password': 'team4pass',  'display_name': 'Team 4'},
    'team5':  {'password': 'team5pass',  'display_name': 'Team 5'},
    'team6':  {'password': 'team6pass',  'display_name': 'Team 6'},
    'team7':  {'password': 'team7pass',  'display_name': 'Team 7'},
    'team8':  {'password': 'team8pass',  'display_name': 'Team 8'},
    'team9':  {'password': 'team9pass',  'display_name': 'Team 9'},
    'team10': {'password': 'team10pass', 'display_name': 'Team 10'},
}

# Admin credentials
ADMIN_USERNAME = 'admin'
ADMIN_PASSWORD = 'admin123'

# ============================================
# CHALLENGE DEFINITIONS
# ============================================
CHALLENGES = {
    1: {
        'title': 'The Current Manual Process',
        'icon': '🟢',
        'emoji': '⚙️',
        'difficulty': 'beginner',
        'time': '15 min',
        'description': 'Understand the traditional CI/CD process by manually building, pushing, and deploying.',
        'tools': ['bitbucket', 'jenkins', 'jfrog', 'argocd'],
    },
    2: {
        'title': 'Fully Automated Pipeline',
        'icon': '🟢',
        'emoji': '🚀',
        'difficulty': 'beginner',
        'time': '15 min',
        'description': 'Experience true CI/CD automation — change code, raise a PR, and everything deploys automatically.',
        'tools': ['bitbucket', 'jenkins'],
    },
    3: {
        'title': 'Security Break',
        'icon': '🔴',
        'emoji': '🛡️',
        'difficulty': 'intermediate',
        'time': '25 min',
        'description': 'A vulnerable base image breaks the pipeline. Fix the security issue to continue.',
        'tools': ['jenkins', 'jfrog'],
    },
    4: {
        'title': 'Secrets & ConfigMaps',
        'icon': '🔐',
        'emoji': '🔑',
        'difficulty': 'intermediate',
        'time': '20 min',
        'description': 'Handle hardcoded secrets properly using Kubernetes Secrets and Helm chart modifications.',
        'tools': ['rancher', 'argocd', 'bitbucket'],
    },
    5: {
        'title': 'Resource Limits & Stability',
        'icon': '⚡',
        'emoji': '📊',
        'difficulty': 'advanced',
        'time': '20 min',
        'description': 'Debug OOMKilled pods and configure proper resource requests and limits.',
        'tools': ['rancher'],
    },
    6: {
        'title': 'Chaos & Observability',
        'icon': '🔥',
        'emoji': '🔥',
        'difficulty': 'advanced',
        'time': '20 min',
        'description': 'Handle traffic spikes, scale your app, and monitor with Grafana.',
        'tools': ['rancher', 'grafana'],
    },
}

